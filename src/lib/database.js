/**
 * Database Operations (v2)
 *
 * All Supabase interactions for the HHA system live here.
 * Each function returns { data, error } so callers can check error
 * and debug the exact failure point.
 *
 * CHANGES FROM v1:
 *   - roll_dimensions → roll_widths (width only, cm)
 *   - rolls: individual items with weight (kg), no quantity, no location
 *   - pipes: length in cm, no location
 *   - liquids: no location
 *   - inks: no location, ink_weights lookup added
 *   - purchase_lists: company_number added
 *   - purchase_list_items: no location, weight_id added for ink
 */

import { supabase, validateEnv } from './supabase.js';
import { debug } from './debug.js';

const MODULE = 'Database';
const TABLE = 'counter';

/**
 * Fetches the current counter value from the DB.
 * If the row doesn't exist yet, returns 0.
 */
export async function getCounterValue() {
  const { valid, missing } = validateEnv();
  if (!valid) {
    debug.error(MODULE, 'getCounterValue – env not configured', { missing });
    return { data: null, error: `Missing env vars: ${missing.join(', ')}` };
  }
  debug.db(MODULE, 'Fetching counter value from "counter" table…');
  const { data, error } = await supabase
    .from(TABLE)
    .select('value')
    .eq('id', 1)
    .maybeSingle();
  if (error) {
    debug.error(MODULE, 'Failed to fetch counter value', error);
    return { data: null, error: error.message };
  }
  const value = data ? data.value : 0;
  debug.db(MODULE, 'Counter value fetched', { value });
  return { data: value, error: null };
}

export async function initCounterRow() {
  const { valid, missing } = validateEnv();
  if (!valid) {
    debug.error(MODULE, 'initCounterRow – env not configured', { missing });
    return { error: `Missing env vars: ${missing.join(', ')}` };
  }
  debug.db(MODULE, 'Initializing counter row…');
  const { data: existing } = await supabase
    .from(TABLE)
    .select('id')
    .eq('id', 1)
    .maybeSingle();
  if (existing) {
    debug.db(MODULE, 'Counter row already exists, skipping init');
    return { error: null };
  }
  const { error } = await supabase
    .from(TABLE)
    .insert({ id: 1, value: 0 });
  if (error) {
    debug.error(MODULE, 'Failed to insert counter row', error);
    return { error: error.message };
  }
  debug.info(MODULE, 'Counter row created with value 0');
  return { error: null };
}

export async function updateCounterValue(newValue) {
  const { valid, missing } = validateEnv();
  if (!valid) {
    debug.error(MODULE, 'updateCounterValue – env not configured', { missing });
    return { error: `Missing env vars: ${missing.join(', ')}` };
  }
  debug.db(MODULE, 'Updating counter value', { newValue });
  const { error } = await supabase
    .from(TABLE)
    .update({ value: newValue, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) {
    debug.error(MODULE, 'Failed to update counter value', error);
    return { error: error.message };
  }
  debug.db(MODULE, 'Counter value updated successfully', { newValue });
  return { error: null };
}

// ── Auth & User Management ───────────────────────────────────

export async function login(username, passwordHash) {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, role')
    .eq('username', username)
    .eq('password', passwordHash)
    .maybeSingle();
  if (error) { debug.error(MODULE, 'Login error', error); return { data: null, error: error.message }; }
  if (!data) return { data: null, error: 'Invalid username or password' };
  return { data, error: null };
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, role, created_at')
    .order('created_at', { ascending: true });
  if (error) { debug.error(MODULE, 'getUsers error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addUser(username, passwordHash, role = 'user') {
  const { error } = await supabase
    .from('app_users')
    .insert({ username, password: passwordHash, role });
  if (error) { debug.error(MODULE, 'addUser error', error); return { error: error.message }; }
  return { error: null };
}

export async function updateUserPassword(userId, newPasswordHash) {
  const { error } = await supabase
    .from('app_users')
    .update({ password: newPasswordHash })
    .eq('id', userId);
  if (error) { debug.error(MODULE, 'updateUserPassword error', error); return { error: error.message }; }
  return { error: null };
}

// ── Ready Orders (جاهز) ──────────────────────────────────────

export async function getReadyOrders() {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('ready_orders')
    .select(`
      id, name, pipe_length, pipe_weight, status, created_at, order_id,
      orders (customer_name, status),
      ready_order_rolls (id, weight)
    `)
    .order('created_at', { ascending: false });
  if (error) { debug.error(MODULE, 'getReadyOrders error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function createReadyOrder(name, orderId = null) {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('ready_orders')
    .insert({ name, order_id: orderId })
    .select()
    .single();
  if (error) { debug.error(MODULE, 'createReadyOrder error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}


export async function saveReadyOrder(orderId, { name, pipeLength, pipeWeight, rolls }) {
  const { valid, missing } = validateEnv();
  if (!valid) return { error: 'Env not configured' };
  const rollsWeights = rolls.map(r => parseFloat(r.weight) || 0);
  const { error } = await supabase.rpc('save_ready_order', {
    p_order_id: orderId,
    p_name: name,
    p_pipe_length: parseFloat(pipeLength) || 0,
    p_pipe_weight: parseFloat(pipeWeight) || 0,
    p_rolls: rollsWeights
  });
  if (error) { debug.error(MODULE, 'saveReadyOrder RPC error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteReadyOrder(orderId) {
  const { valid, missing } = validateEnv();
  if (!valid) return { error: 'Env not configured' };
  const { error } = await supabase
    .from('ready_orders')
    .delete()
    .eq('id', orderId);
  if (error) { debug.error(MODULE, 'deleteReadyOrder error', error); return { error: error.message }; }
  return { error: null };
}

export async function markReadyOrder(orderId) {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase.rpc('mark_ready_order', {
    p_order_id: orderId
  });
  if (error) { debug.error(MODULE, 'markReadyOrder RPC error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

// ── Factory Storage (المخزن) ──────────────────────────────────

// ▸▸▸ Rolls (رولات) – unique items with individual weight

export async function getRolls() {
  const { data, error } = await supabase
    .from('v_rolls')
    .select('*')
    .order('width', { ascending: true });
  if (error) { debug.error(MODULE, 'getRolls error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function getRollWidths() {
  const { data, error } = await supabase
    .from('roll_widths')
    .select('*')
    .order('width', { ascending: true });
  if (error) { debug.error(MODULE, 'getRollWidths error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function getRollTypes() {
  const { data, error } = await supabase
    .from('roll_types')
    .select('*')
    .order('name', { ascending: true });
  if (error) { debug.error(MODULE, 'getRollTypes error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addRollWidth(width) {
  const { error } = await supabase
    .from('roll_widths')
    .insert({ width: parseFloat(width) });
  if (error) { debug.error(MODULE, 'addRollWidth error', error); return { error: error.message }; }
  return { error: null };
}

export async function addRollType(name) {
  const { error } = await supabase
    .from('roll_types')
    .insert({ name: name.trim() });
  if (error) { debug.error(MODULE, 'addRollType error', error); return { error: error.message }; }
  return { error: null };
}

export async function insertRoll(widthId, typeId, weight, notes) {
  const { error } = await supabase
    .from('rolls')
    .insert({
      width_id: widthId,
      type_id: typeId,
      weight: parseFloat(weight) || 0,
      notes: notes || null
    });
  if (error) { debug.error(MODULE, 'insertRoll error', error); return { error: error.message }; }
  return { error: null };
}

export async function updateRoll(id, updates) {
  const { error } = await supabase
    .from('rolls')
    .update(updates)
    .eq('id', id);
  if (error) { debug.error(MODULE, 'updateRoll error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteRoll(id) {
  const { error } = await supabase.from('rolls').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteRoll error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteRollWidth(id) {
  const { error } = await supabase.from('roll_widths').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteRollWidth error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteRollType(id) {
  const { error } = await supabase.from('roll_types').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteRollType error', error); return { error: error.message }; }
  return { error: null };
}

// ▸▸▸ Pipes (مواسير) – length in cm, no location

export async function getPipes() {
  const { data, error } = await supabase
    .from('v_pipes')
    .select('*')
    .order('length', { ascending: true });
  if (error) { debug.error(MODULE, 'getPipes error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function getPipeLengths() {
  const { data, error } = await supabase
    .from('pipe_lengths')
    .select('*')
    .order('length', { ascending: true });
  if (error) { debug.error(MODULE, 'getPipeLengths error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addPipeLength(length) {
  const { error } = await supabase
    .from('pipe_lengths')
    .insert({ length: parseFloat(length) });
  if (error) { debug.error(MODULE, 'addPipeLength error', error); return { error: error.message }; }
  return { error: null };
}

export async function upsertPipe(lengthId, quantity, notes) {
  const { error } = await supabase
    .from('pipes')
    .upsert({
      length_id: lengthId,
      quantity: parseInt(quantity) || 0,
      notes: notes || null
    }, { onConflict: 'length_id' });
  if (error) { debug.error(MODULE, 'upsertPipe error', error); return { error: error.message }; }
  return { error: null };
}

export async function deletePipe(id) {
  const { error } = await supabase.from('pipes').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deletePipe error', error); return { error: error.message }; }
  return { error: null };
}

export async function deletePipeLength(id) {
  const { error } = await supabase.from('pipe_lengths').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deletePipeLength error', error); return { error: error.message }; }
  return { error: null };
}

// ▸▸▸ Liquids (سوائل) – no location

export async function getLiquids() {
  const { data, error } = await supabase
    .from('v_liquids')
    .select('*')
    .order('type_name', { ascending: true });
  if (error) { debug.error(MODULE, 'getLiquids error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function getLiquidTypes() {
  const { data, error } = await supabase
    .from('liquid_types')
    .select('*')
    .order('name', { ascending: true });
  if (error) { debug.error(MODULE, 'getLiquidTypes error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addLiquidType(name) {
  const { error } = await supabase
    .from('liquid_types')
    .insert({ name: name.trim() });
  if (error) { debug.error(MODULE, 'addLiquidType error', error); return { error: error.message }; }
  return { error: null };
}

export async function upsertLiquid(typeId, quantity, notes) {
  const { error } = await supabase
    .from('liquids')
    .upsert({
      type_id: typeId,
      quantity: parseFloat(quantity) || 0,
      notes: notes || null
    }, { onConflict: 'type_id' });
  if (error) { debug.error(MODULE, 'upsertLiquid error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteLiquid(id) {
  const { error } = await supabase.from('liquids').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteLiquid error', error); return { error: error.message }; }
  return { error: null };
}

// ▸▸▸ Inks (أحبار) – no location, ink_weights added

export async function getInks() {
  const { data, error } = await supabase
    .from('v_inks')
    .select('*')
    .order('label', { ascending: true });
  if (error) { debug.error(MODULE, 'getInks error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function getInkCompanies() {
  const { data, error } = await supabase
    .from('ink_companies')
    .select('*')
    .order('name', { ascending: true });
  if (error) { debug.error(MODULE, 'getInkCompanies error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function getInkColors() {
  const { data, error } = await supabase
    .from('ink_colors')
    .select('*')
    .order('name', { ascending: true });
  if (error) { debug.error(MODULE, 'getInkColors error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function getInkWeights() {
  const { data, error } = await supabase
    .from('ink_weights')
    .select('*')
    .order('weight', { ascending: true });
  if (error) { debug.error(MODULE, 'getInkWeights error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addInkCompany(name) {
  const { error } = await supabase
    .from('ink_companies')
    .insert({ name: name.trim() });
  if (error) { debug.error(MODULE, 'addInkCompany error', error); return { error: error.message }; }
  return { error: null };
}

export async function addInkColor(name) {
  const { error } = await supabase
    .from('ink_colors')
    .insert({ name: name.trim() });
  if (error) { debug.error(MODULE, 'addInkColor error', error); return { error: error.message }; }
  return { error: null };
}

export async function addInkWeight(weight) {
  const { error } = await supabase
    .from('ink_weights')
    .insert({ weight: parseFloat(weight) });
  if (error) { debug.error(MODULE, 'addInkWeight error', error); return { error: error.message }; }
  return { error: null };
}

export async function upsertInk(companyId, colorId, quantity, notes) {
  const { error } = await supabase
    .from('inks')
    .upsert({
      company_id: companyId,
      color_id: colorId,
      quantity: parseFloat(quantity) || 0,
      notes: notes || null
    }, { onConflict: 'company_id, color_id' });
  if (error) { debug.error(MODULE, 'upsertInk error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteInk(id) {
  const { error } = await supabase.from('inks').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteInk error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteInkCompany(id) {
  const { error } = await supabase.from('ink_companies').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteInkCompany error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteInkColor(id) {
  const { error } = await supabase.from('ink_colors').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteInkColor error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteInkWeight(id) {
  const { error } = await supabase.from('ink_weights').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteInkWeight error', error); return { error: error.message }; }
  return { error: null };
}

// ── Purchase Lists (قوائم المشتريات) ──────────────────────────

// ▸▸▸ Purchase Offices (مكاتب الشراء)

export async function getPurchaseOffices() {
  const { data, error } = await supabase
    .from('purchase_offices')
    .select('*')
    .order('name', { ascending: true });
  if (error) { debug.error(MODULE, 'getPurchaseOffices error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addPurchaseOffice(name) {
  const { error } = await supabase
    .from('purchase_offices')
    .insert({ name: name.trim() });
  if (error) { debug.error(MODULE, 'addPurchaseOffice error', error); return { error: error.message }; }
  return { error: null };
}

export async function deletePurchaseOffice(id) {
  const { error } = await supabase.from('purchase_offices').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deletePurchaseOffice error', error); return { error: error.message }; }
  return { error: null };
}

// ▸▸▸ Purchase Lists (قوائم المشتريات)

export async function getPurchaseLists() {
  const { data, error } = await supabase
    .from('v_purchase_lists')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { debug.error(MODULE, 'getPurchaseLists error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function getPurchaseList(id) {
  const { data, error } = await supabase
    .from('purchase_lists')
    .select('*, purchase_offices(name)')
    .eq('id', id)
    .single();
  if (error) { debug.error(MODULE, 'getPurchaseList error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function createPurchaseList(officeId, companyNumber, purchaseDate, notes, createdBy) {
  const { data, error } = await supabase
    .from('purchase_lists')
    .insert({
      office_id: officeId,
      company_number: companyNumber,
      purchase_date: purchaseDate,
      notes: notes || null,
      created_by: createdBy || null
    })
    .select()
    .single();
  if (error) { debug.error(MODULE, 'createPurchaseList error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function updatePurchaseList(id, updates) {
  const { error } = await supabase
    .from('purchase_lists')
    .update(updates)
    .eq('id', id);
  if (error) { debug.error(MODULE, 'updatePurchaseList error', error); return { error: error.message }; }
  return { error: null };
}

export async function deletePurchaseList(id) {
  const { error } = await supabase.from('purchase_lists').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deletePurchaseList error', error); return { error: error.message }; }
  return { error: null };
}

export async function confirmPurchaseList(listId) {
  const { data, error } = await supabase.rpc('confirm_purchase_list', {
    p_list_id: listId
  });
  if (error) { debug.error(MODULE, 'confirmPurchaseList error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

// ▸▸▸ Purchase List Items (عناصر قائمة المشتريات)

export async function getPurchaseListItems(listId) {
  const { data, error } = await supabase
    .from('v_purchase_list_items')
    .select('*')
    .eq('purchase_list_id', listId)
    .order('id', { ascending: true });
  if (error) { debug.error(MODULE, 'getPurchaseListItems error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addPurchaseListItem(listId, itemType, variantId1, variantId2, quantity, unit, weightId, notes) {
  const { error } = await supabase
    .from('purchase_list_items')
    .insert({
      purchase_list_id: listId,
      item_type: itemType,
      variant_id_1: variantId1,
      variant_id_2: variantId2 || null,
      quantity: parseFloat(quantity) || 0,
      unit: unit || 'piece',
      weight_id: weightId || null,
      notes: notes || null
    });
  if (error) { debug.error(MODULE, 'addPurchaseListItem error', error); return { data: null, error: error.message }; }
  return { error: null };
}

export async function updatePurchaseListItem(id, updates) {
  const { error } = await supabase
    .from('purchase_list_items')
    .update(updates)
    .eq('id', id);
  if (error) { debug.error(MODULE, 'updatePurchaseListItem error', error); return { data: null, error: error.message }; }
  return { error: null };
}

export async function deletePurchaseListItem(id) {
  const { error } = await supabase.from('purchase_list_items').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deletePurchaseListItem error', error); return { error: error.message }; }
  return { error: null };
}

// ── Orders (الطلبيات) ──────────────────────────────────────────

export async function getOrders() {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { debug.error(MODULE, 'getOrders error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function createOrder(customerName, orderDate, details, status, createdBy) {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_name: customerName,
      order_date: orderDate || new Date().toISOString().split('T')[0],
      details: details || null,
      status: status || 'pending',
      created_by: createdBy || null
    })
    .select()
    .single();
  if (error) { debug.error(MODULE, 'createOrder error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function updateOrder(id, updates) {
  const { valid, missing } = validateEnv();
  if (!valid) return { error: 'Env not configured' };
  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id);
  if (error) { debug.error(MODULE, 'updateOrder error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteOrder(id) {
  const { valid, missing } = validateEnv();
  if (!valid) return { error: 'Env not configured' };
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);
  if (error) { debug.error(MODULE, 'deleteOrder error', error); return { error: error.message }; }
  return { error: null };
}

/**
 * Inserts comprehensive order form data linked to a base order.
 * @param {number} orderId - The ID of the base order.
 * @param {object} formData - Object containing all order form fields.
 */
export async function createFullOrder(orderId, formData) {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  if (!orderId) return { data: null, error: 'Missing orderId' };
  const payload = { ...formData, order_id: orderId };
  const { data, error } = await supabase
    .from('order_forms')
    .insert(payload)
    .select()
    .single();
  if (error) {
    debug.error(MODULE, 'createFullOrder error', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}
