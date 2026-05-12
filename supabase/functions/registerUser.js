// registerUser.js
import { supabase } from './supabaseClient';

export const registerUser = async ({ email, password, name, phone, age }) => {
  try {
    // 1️⃣ إنشاء المستخدم في Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    const userId = authData.user.id;

    // 2️⃣ حفظ بيانات profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userId, name, email, phone, age }])
      .select();
    if (profileError) throw profileError;

    // 3️⃣ حفظ بيانات user_stats
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .insert([{ user_id: userId, level: 1, points: 0, achievements: 0, total_achievements: 20 }])
      .select();
    if (statsError) throw statsError;

    console.log('✅ تم التسجيل وحفظ البيانات بنجاح');
    return { profile: profileData[0], stats: statsData[0] };

  } catch (error) {
    console.error('❌ خطأ أثناء التسجيل:', error.message);
    return null;
  }
};