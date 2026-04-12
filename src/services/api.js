import { supabase } from '../supabaseClient';

// Input validation helper
const validate = (rules) => {
  for (const [field, { value, required, maxLength }] of Object.entries(rules)) {
    if (required && (!value || String(value).trim() === ''))
      throw new Error(`${field} is required`);
    if (maxLength && String(value || '').length > maxLength)
      throw new Error(`${field} exceeds maximum length of ${maxLength}`);
  }
};

export const storeService = {
  async getAll() {
    const { data, error } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(store) {
    validate({
      id:   { value: store.id,   required: true, maxLength: 50 },
      name: { value: store.name, required: true, maxLength: 255 },
      phone:{ value: store.phone, maxLength: 50 }
    });
    const { data, error } = await supabase.from('stores').insert([{ ...store, is_active: true }]).select();
    if (error) throw error;
    return data[0];
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('stores').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async getDeleted() {
    const { data, error } = await supabase.from('stores').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async softDelete(id) {
    const { error } = await supabase.from('stores').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    return true;
  },
  async restore(id) {
    const { error } = await supabase.from('stores').update({ deleted_at: null }).eq('id', id);
    if (error) throw error;
    return true;
  },
  async delete(id) {
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  async bulkCreate(storesList) {
    const { data, error } = await supabase.from('stores').upsert(storesList).select();
    if (error) throw error;
    return data;
  },
  async bulkUpdateMetrics(metricsData) {
    // metricsData is an array of objects: { id, orders, gmv, ratings, avg_cart, discount, delivery, last_sync_date }
    // Using Promise.all for updates since Supabase single-call bulk update with varying row values is tricky via JS client
    // without an exposed RPC function.
    const promises = metricsData.map(item => 
      supabase.from('stores').update(item).eq('id', item.id)
    );
    await Promise.all(promises);
    return true;
  },
  async bulkUpdate(ids, updates) {
    const { data, error } = await supabase.from('stores').update(updates).in('id', ids).select();
    if (error) throw error;
    return data;
  }
};

export const activityService = {
  async getAll() {
    const { data, error } = await supabase.from('calls').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(activity) {
    validate({
      store_id: { value: activity.store_id, required: true },
      notes:    { value: activity.notes, maxLength: 2000 }
    });
    const { data, error } = await supabase.from('calls').insert([{
      store_id: activity.store_id,
      outcome_id: activity.outcome_id,
      notes: activity.notes,
      follow_up_date: activity.follow_up_date || null,
      is_resolved: false
    }]).select();
    if (error) throw error;
    return data[0];
  },
  async resolve(id) {
    const { data, error } = await supabase.from('calls').update({ is_resolved: true }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async bulkResolve(ids) {
    const { data, error } = await supabase.from('calls').update({ is_resolved: true }).in('id', ids).select();
    if (error) throw error;
    return data;
  }
};

export const settingsService = {
  async getOutcomes() {
    const { data, error } = await supabase.from('call_outcomes').select('*');
    if (error) throw error;
    return data;
  },
  async createOutcome(name) {
    validate({ name: { value: name, required: true, maxLength: 255 } });
    const { data, error } = await supabase.from('call_outcomes').insert([{ name: name.trim() }]).select();
    if (error) throw error;
    return data[0];
  },
  async deleteOutcome(id) {
    const { error } = await supabase.from('call_outcomes').delete().eq('id', id);
    if (error) throw error;
  },
  async getZones() {
    const { data, error } = await supabase.from('zones').select('*');
    if (error) throw error;
    return data;
  },
  async createZone(name) {
    validate({ name: { value: name, required: true, maxLength: 255 } });
    const { data, error } = await supabase.from('zones').insert([{ name: name.trim() }]).select();
    if (error) throw error;
    return data[0];
  },
  async deleteZone(id) {
    const { error } = await supabase.from('zones').delete().eq('id', id);
    if (error) throw error;
  },
  async getCategories() {
    const { data, error } = await supabase.from('store_categories').select('*');
    if (error) throw error;
    return data;
  },
  async createCategory(name) {
    validate({ name: { value: name, required: true, maxLength: 255 } });
    const { data, error } = await supabase.from('store_categories').insert([{ name: name.trim() }]).select();
    if (error) throw error;
    return data[0];
  },
  async deleteCategory(id) {
    const { error } = await supabase.from('store_categories').delete().eq('id', id);
    if (error) throw error;
  },
  async getClosureReasons() {
    const { data, error } = await supabase.from('closure_reasons').select('*').order('name');
    if (error) throw error;
    return data;
  },
  async createClosureReason(name) {
    const { data, error } = await supabase.from('closure_reasons').insert([{ name }]).select();
    if (error) throw error;
    return data[0];
  },
  async deleteClosureReason(id) {
    const { error } = await supabase.from('closure_reasons').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

export const libraryService = {
  async getAll() {
    const { data, error } = await supabase.from('library_links').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(name, url, description) {
    validate({
      name: { value: name, required: true, maxLength: 255 },
      url:  { value: url,  required: true, maxLength: 2048 }
    });
    const { data, error } = await supabase.from('library_links').insert([{ name, url, description }]).select();
    if (error) throw error;
    return data[0];
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('library_links').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async delete(id) {
    const { error } = await supabase.from('library_links').delete().eq('id', id);
    if (error) throw error;
  }
};

export const offersService = {
  async getAll() {
    const { data, error } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(offer) {
    validate({ title: { value: offer.title, required: true, maxLength: 255 } });
    const { data, error } = await supabase.from('offers').insert([offer]).select();
    if (error) throw error;
    return data[0];
  },
  async update(id, updates) {
    const { data, error } = await supabase.from('offers').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },
  async delete(id) {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) throw error;
  }
};

export const targetService = {
  async getForMonth(monthYear) {
    const { data, error } = await supabase.from('targets').select('*').eq('month_year', monthYear).maybeSingle();
    if (error) throw error;
    return data;
  },
  async save(target) {
    validate({ weekly_goal: { value: target.weekly_goal, required: true } });
    const { data, error } = await supabase.from('targets').upsert(target, { onConflict: 'month_year' }).select();
    if (error) throw error;
    return data[0];
  }
};
