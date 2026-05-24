from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
import os
import time
from curl_cffi import requests as cffi_requests

app = Flask(__name__)
_cache: dict = {}
CACHE_TTL = 1800  # 30 دقيقة

CORS(app)

DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

@app.route('/')
def index():
    return send_from_directory(DIST_DIR, 'index.html')

@app.errorhandler(404)
def not_found(e):
    full = os.path.join(DIST_DIR, request.path.lstrip('/'))
    if os.path.exists(full) and os.path.isfile(full):
        return send_from_directory(DIST_DIR, request.path.lstrip('/'))
    return send_from_directory(DIST_DIR, 'index.html')

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
FEATURES = [
    'Open', 'High', 'Low', 'Close', 'Volume',
    'MA_7', 'MA_21', 'MA_50',
    'STD_7', 'STD_21',
    'RSI', 'MACD', 'MACD_signal',
    'BB_upper', 'BB_lower', 'BB_width',
    'Return_1d', 'Return_5d',
    'High_Low_Range', 'Volume_Ratio',
]

def load_model():
    for path in ('exported_model/best_model.pkl', 'exported_model/best_model.json'):
        if not os.path.exists(path):
            continue
        try:
            return joblib.load(path)
        except Exception:
            m = xgb.XGBRegressor()
            m.load_model(path)
            return m
    raise FileNotFoundError('No model file found in exported_model/')

model    = load_model()
scaler_X = joblib.load('exported_model/scaler_X.pkl')

# ---------------------------------------------------------------------------
# Yahoo Finance Direct API (بدون مكتبة yfinance)
# ---------------------------------------------------------------------------

def _yahoo_chart(ticker: str, period: str = '6mo', interval: str = '1d') -> pd.DataFrame:
    """جلب بيانات السهم مباشرة من Yahoo Finance API باستخدام curl_cffi."""
    url = f'https://query1.finance.yahoo.com/v8/finance/chart/{ticker}'
    params = {
        'range': period,
        'interval': interval,
        'includePrePost': 'false',
        'events': '',
    }
    session = cffi_requests.Session(impersonate="chrome")
    resp = session.get(url, params=params, timeout=30)
    data = resp.json()

    result = data.get('chart', {}).get('result')
    if not result:
        return pd.DataFrame()

    chart = result[0]
    timestamps = chart.get('timestamp', [])
    quote = chart.get('indicators', {}).get('quote', [{}])[0]

    if not timestamps or not quote:
        return pd.DataFrame()

    df = pd.DataFrame({
        'Open':   quote.get('open', []),
        'High':   quote.get('high', []),
        'Low':    quote.get('low', []),
        'Close':  quote.get('close', []),
        'Volume': quote.get('volume', []),
    }, index=pd.to_datetime(timestamps, unit='s'))

    df.index.name = 'Date'
    return df.dropna()


def fetch_stock(ticker: str, retries: int = 3) -> pd.DataFrame:
    """جلب بيانات السهم مع كاش وإعادة محاولة."""
    now = time.time()
    if ticker in _cache and now - _cache[ticker][1] < CACHE_TTL:
        return _cache[ticker][0]

    last_error = None
    for attempt in range(retries):
        try:
            df = _yahoo_chart(ticker, period='6mo')
            if not df.empty and len(df) >= 10:
                _cache[ticker] = (df, now)
                return df
        except Exception as e:
            last_error = e
            time.sleep(2 * (attempt + 1))

    print(f"[yahoo] Failed to fetch {ticker} after {retries} retries: {last_error}")
    return pd.DataFrame()


def fetch_prices_bulk(tickers: list) -> dict:
    """جلب أسعار عدة أسهم."""
    result = {}
    session = cffi_requests.Session(impersonate="chrome")

    for ticker in tickers:
        try:
            url = f'https://query1.finance.yahoo.com/v8/finance/chart/{ticker}'
            params = {'range': '5d', 'interval': '1d', 'includePrePost': 'false'}
            resp = session.get(url, params=params, timeout=20)
            data = resp.json()

            chart_result = data.get('chart', {}).get('result')
            if not chart_result:
                continue

            quote = chart_result[0].get('indicators', {}).get('quote', [{}])[0]
            closes = [c for c in quote.get('close', []) if c is not None]

            if len(closes) >= 2:
                current = round(closes[-1], 2)
                prev = round(closes[-2], 2)
                change = round(current - prev, 2)
                change_pct = round((change / prev) * 100, 2)
                result[ticker] = {'price': current, 'change': change, 'changePercent': change_pct}
        except Exception:
            continue

    return result


# ---------------------------------------------------------------------------
# Feature Engineering
# ---------------------------------------------------------------------------

def add_features(df: pd.DataFrame) -> pd.DataFrame:
    d = df.copy()
    d['MA_7']  = d['Close'].rolling(7).mean()
    d['MA_21'] = d['Close'].rolling(21).mean()
    d['MA_50'] = d['Close'].rolling(50).mean()

    d['STD_7']  = d['Close'].rolling(7).std()
    d['STD_21'] = d['Close'].rolling(21).std()

    delta = d['Close'].diff()
    gain  = delta.clip(lower=0).rolling(14).mean()
    loss  = (-delta.clip(upper=0)).rolling(14).mean()
    d['RSI'] = 100 - (100 / (1 + gain / loss.replace(0, np.nan)))

    ema12 = d['Close'].ewm(span=12).mean()
    ema26 = d['Close'].ewm(span=26).mean()
    d['MACD']        = ema12 - ema26
    d['MACD_signal'] = d['MACD'].ewm(span=9).mean()

    mid = d['Close'].rolling(20).mean()
    std = d['Close'].rolling(20).std()
    d['BB_upper'] = mid + 2 * std
    d['BB_lower'] = mid - 2 * std
    d['BB_width'] = d['BB_upper'] - d['BB_lower']

    d['Return_1d'] = d['Close'].pct_change(1)
    d['Return_5d'] = d['Close'].pct_change(5)

    d['High_Low_Range'] = (d['High'] - d['Low']) / d['Close']
    d['Volume_Ratio']   = d['Volume'] / d['Volume'].rolling(7).mean()

    return d.dropna()


def get_volatility(df: pd.DataFrame) -> float:
    returns = df['Close'].pct_change().dropna()
    return float(returns.tail(20).std() * 100)


def get_signal(change_percent: float, volatility: float) -> str:
    threshold = max(0.5, volatility * 0.5)
    if change_percent >= threshold:
        return 'شراء'
    elif change_percent <= -(threshold * 0.6):
        return 'بيع'
    return 'انتظار'


HORIZON_DAYS        = {'short': 252, 'medium': 630, 'long': 1260}
HORIZON_LABEL       = {'short': 'سنة واحدة', 'medium': '2-3 سنوات', 'long': '3-6 سنوات'}

HISTORICAL_ANNUAL   = 8.0
HISTORICAL_DAILY    = (1 + HISTORICAL_ANNUAL / 100) ** (1 / 252) - 1

HORIZON_MODEL_WEIGHT = {'short': 0.70, 'medium': 0.40, 'long': 0.20}


def project_price(current: float, daily_predicted: float, horizon: str):
    days     = HORIZON_DAYS.get(horizon, 21)
    model_w  = HORIZON_MODEL_WEIGHT.get(horizon, 0.5)
    hist_w   = 1.0 - model_w

    model_daily  = (daily_predicted - current) / current
    blended_daily = model_w * model_daily + hist_w * HISTORICAL_DAILY
    projected     = current * (1 + blended_daily) ** days
    change_pct    = round((projected - current) / current * 100, 2)
    return round(projected, 2), change_pct


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route('/api/predict', methods=['POST'], strict_slashes=False)
@app.route('/predict', methods=['POST'])
def predict():
    body    = request.json or {}
    ticker  = body.get('ticker', '2222.SR')
    horizon = body.get('horizon', 'short')

    df = fetch_stock(ticker)
    if df.empty or len(df) < 50:
        return jsonify({'error': f'Not enough data for {ticker}'}), 400

    df = add_features(df)
    if df.empty:
        return jsonify({'error': 'Feature calculation failed'}), 400

    volatility       = get_volatility(df)
    row              = df[FEATURES].iloc[[-1]].values
    row_scaled       = scaler_X.transform(row)
    daily_predicted  = float(model.predict(row_scaled)[0])
    current          = float(df['Close'].iloc[-1])
    daily_change_pct = round((daily_predicted - current) / current * 100, 2)

    projected_price, projected_change = project_price(current, daily_predicted, horizon)

    return jsonify({
        'ticker'                : ticker,
        'current_price'         : round(current, 2),
        'predicted_price'       : projected_price,
        'change_percent'        : projected_change,
        'daily_predicted_price' : round(daily_predicted, 2),
        'daily_change_percent'  : daily_change_pct,
        'signal'                : get_signal(projected_change, volatility),
        'volatility'            : round(volatility, 3),
        'threshold'             : round(max(0.5, volatility * 0.5), 3),
        'horizon'               : horizon,
        'horizon_label'         : HORIZON_LABEL.get(horizon, ''),
        'horizon_days'          : HORIZON_DAYS.get(horizon, 21),
    })


@app.route('/api/prices', methods=['POST'], strict_slashes=False)
@app.route('/prices', methods=['POST'])
def prices():
    tickers = request.json.get('tickers', [])
    if not tickers:
        return jsonify({'error': 'No tickers provided'}), 400

    result = fetch_prices_bulk(tickers)
    return jsonify(result)


@app.route('/api/portfolio', methods=['POST'], strict_slashes=False)
@app.route('/portfolio', methods=['POST'])
def portfolio_suggest():
    body        = request.json or {}
    stocks_info = body.get('stocks', [])
    horizon     = body.get('horizon', 'long')
    amount      = float(body.get('amount', 50000))

    growth_w = {'short': 0.7, 'medium': 0.5, 'long': 0.3}.get(horizon, 0.5)
    stable_w = 1.0 - growth_w

    results = []
    for info in stocks_info:
        ticker = info.get('ticker', '')
        try:
            df = fetch_stock(ticker)
            if df.empty or len(df) < 50:
                continue

            df = add_features(df)
            if df.empty:
                continue

            volatility      = get_volatility(df)
            row             = df[FEATURES].iloc[[-1]].values
            row_scaled      = scaler_X.transform(row)
            daily_predicted = float(model.predict(row_scaled)[0])
            current         = float(df['Close'].iloc[-1])

            projected_price, change_pct = project_price(current, daily_predicted, horizon)
            daily_change_pct = round((daily_predicted - current) / current * 100, 4)

            if change_pct < -15.0:
                continue

            growth_score    = max(0.0, daily_change_pct + 2)
            stability_score = max(0.0, 20.0 - volatility) / 20.0 * 100
            score = growth_score * growth_w + stability_score * stable_w

            results.append({
                'ticker'         : ticker,
                'name'           : info.get('name', ticker),
                'sector'         : info.get('sector', 'متنوع'),
                'current_price'  : round(current, 2),
                'predicted_price': projected_price,
                'change_percent' : change_pct,
                'volatility'     : round(volatility, 3),
                'signal'         : get_signal(change_pct, volatility),
                'score'          : round(score, 3),
            })
        except Exception:
            continue

    if not results:
        return jsonify({'error': 'لم نتمكن من تحليل الأسهم'}), 400

    best_per_sector: dict = {}
    for r in results:
        sec = r['sector']
        if sec not in best_per_sector or r['score'] > best_per_sector[sec]['score']:
            best_per_sector[sec] = r

    total_score = sum(max(0.1, v['score']) for v in best_per_sector.values())

    allocations = []
    for sec_name, stock in best_per_sector.items():
        pct = round(max(0.1, stock['score']) / total_score * 100, 1)
        allocations.append({
            'sector'         : sec_name,
            'percentage'     : pct,
            'stock_name'     : stock['name'],
            'ticker'         : stock['ticker'],
            'current_price'  : stock['current_price'],
            'change_percent' : stock['change_percent'],
            'signal'         : stock['signal'],
            'amount'         : round(amount * pct / 100, 2),
        })

    allocations.sort(key=lambda x: x['percentage'], reverse=True)

    return jsonify({
        'allocations'  : allocations,
        'total_amount' : amount,
        'horizon'      : horizon,
        'horizon_label': HORIZON_LABEL.get(horizon, ''),
        'horizon_days' : HORIZON_DAYS.get(horizon, 21),
    })


@app.route('/health', methods=['GET'])
def health():
    model_name = type(model).__name__
    return jsonify({'status': 'ok', 'model': model_name})


@app.route('/api/test', methods=['POST'], strict_slashes=False)
def test_post():
    return jsonify({'status': 'ok', 'received': request.json})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
