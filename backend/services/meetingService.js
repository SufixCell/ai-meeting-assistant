const supabase = require('../config/supabase');
const { joinMeeting } = require('./meetingBaasService');

async function saveMeeting(meetingData) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  
  console.log('Saving to Supabase database...');
  const { data, error } = await supabase
    .from('meetings')
    .insert([meetingData])
    .select();
    
  if (error) {
    throw error;
  }
  
  return data[0];
}

async function getMeetingsByUser(userId) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    throw error;
  }
  
  return data;
}

async function deleteMeeting(meetingId) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', meetingId);
    
  if (error) {
    throw error;
  }
  
  return true;
}

async function joinOnlineMeeting(meetingUrl) {
  return await joinMeeting(meetingUrl);
}

module.exports = {
  saveMeeting,
  getMeetingsByUser,
  deleteMeeting,
  joinOnlineMeeting
};
