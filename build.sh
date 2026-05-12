#!/bin/bash
npm install
node ./node_modules/.bin/vite build
pip install -r requirements.txt
