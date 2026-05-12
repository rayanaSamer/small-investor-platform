import { supabase } from './supabaseClient';

export const registerUser = async ({ email, password, name, phone, age }) => {
  try {
    // إنشاء المستخدم في Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    const userId = authData.user.id;

    // حفظ بيانات profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userId, name, email, phone, age }])
      .select();
    if (profileError) throw profileError;

    // حفظ بيانات user_stats
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .insert([{ user_id: userId }])
      .select();
    if (statsError) throw statsError;

    console.log('✅ تم التسجيل وحفظ البيانات بنجاح');
    return { profile: profileData[0], stats: statsData[0] };

  } catch (error) {
    console.error('❌ خطأ أثناء التسجيل:', error.message);
    return null;
  }
};