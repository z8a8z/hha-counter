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
  // Insert user into app_users
  const { data, error } = await supabase
    .from('app_users')
    .insert({ username, password: passwordHash, role })
    .select('id')
    .single();
  if (error) { debug.error(MODULE, 'addUser error', error); return { error: error.message }; }
  // Auto-create empty user_permissions row
  if (data) {
    const { error: permErr } = await supabase
      .from('user_permissions')
      .insert({ user_id: data.id, allowed_tabs: [] });
    if (permErr) { debug.error(MODULE, 'addUser – failed to create permissions row', permErr); }
  }
  return { error: null };
}

export async function deleteUser(userId) {
  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', userId);
  if (error) { debug.error(MODULE, 'deleteUser error', error); return { error: error.message }; }
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

export async function updateUserRole(userId, newRole) {
  const { error } = await supabase
    .from('app_users')
    .update({ role: newRole })
    .eq('id', userId);
  if (error) { debug.error(MODULE, 'updateUserRole error', error); return { error: error.message }; }
  return { error: null };
}

// ── Per-User Permissions (Authorities) ───────────────────────

export async function getUserPermissions(userId) {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('allowed_tabs')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) { debug.error(MODULE, 'getUserPermissions error', error); return { data: null, error: error.message }; }
  return { data: data ? data.allowed_tabs : [], error: null };
}

export async function getAllUserPermissions() {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('user_id, allowed_tabs');
  if (error) { debug.error(MODULE, 'getAllUserPermissions error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function updateUserPermissions(userId, allowedTabs) {
  const { error } = await supabase
    .from('user_permissions')
    .upsert({ user_id: userId, allowed_tabs: allowedTabs }, { onConflict: 'user_id' });
  if (error) { debug.error(MODULE, 'updateUserPermissions error', error); return { error: error.message }; }
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
      orders (customer_name, status, order_forms (functional_desc)),
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
  
  // 1. Delete rolls first
  const { error: rollsErr } = await supabase
    .from('ready_order_rolls')
    .delete()
    .eq('order_id', orderId);
  if (rollsErr) { debug.error(MODULE, 'deleteReadyOrder - rolls error', rollsErr); return { error: rollsErr.message }; }

  // 2. Delete ready_order
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
    .from('rolls')
    .select(`
      id, weight, notes, created_at, updated_at, purchase_list_item_id,
      roll_widths (id, width),
      roll_types (id, name),
      roll_thicknesses (id, thickness)
    `)
    .order('created_at', { ascending: false });
  if (error) { debug.error(MODULE, 'getRolls error', error); return { data: null, error: error.message }; }
  
  const mapped = (data || []).map(r => ({
    id: r.id,
    weight: r.weight,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    purchase_list_item_id: r.purchase_list_item_id,
    width_id: r.roll_widths?.id,
    width_label: r.roll_widths?.width ? `${r.roll_widths.width}` : '',
    type_id: r.roll_types?.id,
    type_name: r.roll_types?.name || '',
    thickness_id: r.roll_thicknesses?.id,
    thickness_label: r.roll_thicknesses?.thickness ? `${r.roll_thicknesses.thickness}` : ''
  }));
  
  return { data: mapped, error: null };
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

export async function getRollThicknesses() {
  const { data, error } = await supabase
    .from('roll_thicknesses')
    .select('*')
    .order('thickness', { ascending: true });
  if (error) { debug.error(MODULE, 'getRollThicknesses error', error); return { data: null, error: error.message }; }
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

export async function addRollThickness(thickness) {
  const { error } = await supabase
    .from('roll_thicknesses')
    .insert({ thickness: parseFloat(thickness) });
  if (error) { debug.error(MODULE, 'addRollThickness error', error); return { error: error.message }; }
  return { error: null };
}

export async function insertRoll(widthId, typeId, weight, notes, thicknessId = null) {
  const { error } = await supabase
    .from('rolls')
    .insert({
      width_id: widthId,
      type_id: typeId,
      weight: parseFloat(weight) || 0,
      notes: notes || null,
      thickness_id: thicknessId
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

export async function deleteRollThickness(id) {
  const { error } = await supabase.from('roll_thicknesses').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteRollThickness error', error); return { error: error.message }; }
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

export async function deleteLiquidType(id) {
  const { error } = await supabase.from('liquid_types').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteLiquidType error', error); return { error: error.message }; }
  return { error: null };
}

export async function getLiquidVolumes() {
  const { data, error } = await supabase
    .from('liquid_volumes')
    .select('*')
    .order('volume', { ascending: true });
  if (error) { debug.error(MODULE, 'getLiquidVolumes error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addLiquidVolume(volume) {
  const { error } = await supabase
    .from('liquid_volumes')
    .insert({ volume: parseFloat(volume) });
  if (error) { debug.error(MODULE, 'addLiquidVolume error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteLiquidVolume(id) {
  const { error } = await supabase.from('liquid_volumes').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteLiquidVolume error', error); return { error: error.message }; }
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

// ▸▸▸ Glues (صمغ)

export async function getGlueTypes() {
  const { data, error } = await supabase
    .from('glue_types')
    .select('*')
    .order('name', { ascending: true });
  if (error) { debug.error(MODULE, 'getGlueTypes error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addGlueType(name) {
  const { error } = await supabase
    .from('glue_types')
    .insert({ name: name.trim() });
  if (error) { debug.error(MODULE, 'addGlueType error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteGlueType(id) {
  const { error } = await supabase.from('glue_types').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteGlueType error', error); return { error: error.message }; }
  return { error: null };
}

export async function getGlueWeights() {
  const { data, error } = await supabase
    .from('glue_weights')
    .select('*')
    .order('weight', { ascending: true });
  if (error) { debug.error(MODULE, 'getGlueWeights error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addGlueWeight(weight) {
  const { error } = await supabase
    .from('glue_weights')
    .insert({ weight: parseFloat(weight) });
  if (error) { debug.error(MODULE, 'addGlueWeight error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteGlueWeight(id) {
  const { error } = await supabase.from('glue_weights').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteGlueWeight error', error); return { error: error.message }; }
  return { error: null };
}

export async function getGlues() {
  const { data, error } = await supabase
    .from('v_glues')
    .select('*')
    .order('type_name', { ascending: true });
  if (error) { debug.error(MODULE, 'getGlues error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function upsertGlue(typeId, quantity, notes) {
  const { error } = await supabase
    .from('glues')
    .upsert({
      type_id: typeId,
      quantity: parseFloat(quantity) || 0,
      notes: notes || null
    }, { onConflict: 'type_id' });
  if (error) { debug.error(MODULE, 'upsertGlue error', error); return { error: error.message }; }
  return { error: null };
}

export async function deleteGlue(id) {
  const { error } = await supabase.from('glues').delete().eq('id', id);
  if (error) { debug.error(MODULE, 'deleteGlue error', error); return { error: error.message }; }
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
    .select('*, order_forms (functional_desc)')
    .order('created_at', { ascending: false });
  if (error) { debug.error(MODULE, 'getOrders error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function createOrder(customerName, orderDate, details, status, createdBy, deliveryDate) {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_name: customerName,
      order_date: orderDate || new Date().toISOString().split('T')[0],
      details: details || null,
      status: status || 'pending',
      created_by: createdBy || null,
      delivery_date: deliveryDate || null
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

  // 1. Fetch matching ready orders
  const { data: readyOrders, error: fetchErr } = await supabase
    .from('ready_orders')
    .select('id')
    .eq('order_id', id);

  if (fetchErr) {
    debug.error(MODULE, 'deleteOrder - fetch ready_orders error', fetchErr);
    return { error: fetchErr.message };
  }

  // 2. Delete related rolls & ready orders
  if (readyOrders && readyOrders.length > 0) {
    const readyIds = readyOrders.map(r => r.id);
    
    // Delete from ready_order_rolls
    const { error: rollsErr } = await supabase
      .from('ready_order_rolls')
      .delete()
      .in('order_id', readyIds);
      
    if (rollsErr) {
      debug.error(MODULE, 'deleteOrder - delete ready_order_rolls error', rollsErr);
      return { error: rollsErr.message };
    }

    // Delete from ready_orders
    const { error: roErr } = await supabase
      .from('ready_orders')
      .delete()
      .in('id', readyIds);

    if (roErr) {
      debug.error(MODULE, 'deleteOrder - delete ready_orders error', roErr);
      return { error: roErr.message };
    }
  }

  // 3. Delete from order_forms (production forms linked to order)
  const { error: ofErr } = await supabase
    .from('order_forms')
    .delete()
    .eq('order_id', id);
  if (ofErr) {
    debug.error(MODULE, 'deleteOrder - delete order_forms error', ofErr);
  }

  // 4. Delete the base order
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

export async function updateFullOrder(orderId, formData) {
  const { valid, missing } = validateEnv();
  if (!valid) return { error: 'Env not configured' };
  if (!orderId) return { error: 'Missing orderId' };

  // Check if order details record exists
  const { data: existing, error: checkError } = await supabase
    .from('order_forms')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (checkError) {
    debug.error(MODULE, 'updateFullOrder check error', checkError);
    return { error: checkError.message };
  }

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('order_forms')
      .update(formData)
      .eq('order_id', orderId);
    if (error) {
      debug.error(MODULE, 'updateFullOrder update error', error);
      return { error: error.message };
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('order_forms')
      .insert({ order_id: orderId, ...formData });
    if (error) {
      debug.error(MODULE, 'updateFullOrder insert error', error);
      return { error: error.message };
    }
  }
  return { error: null };
}

export async function getOrderForm(orderId) {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('order_forms')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) {
    debug.error(MODULE, 'getOrderForm error', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function getPrintSettings() {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('print_settings')
    .select('settings')
    .eq('id', 1)
    .maybeSingle();
  if (error) {
    debug.error(MODULE, 'getPrintSettings error', error);
    return { data: null, error: error.message };
  }
  return { data: data ? data.settings : null, error: null };
}

export async function savePrintSettings(settings) {
  const { valid, missing } = validateEnv();
  if (!valid) return { error: 'Env not configured' };
  const { error } = await supabase
    .from('print_settings')
    .upsert({ id: 1, settings, updated_at: new Date().toISOString() });
  if (error) {
    debug.error(MODULE, 'savePrintSettings error', error);
    return { error: error.message };
  }
  return { error: null };
}

export async function getDamagedRecords() {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('damaged_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    debug.error(MODULE, 'getDamagedRecords error', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function addDamagedRecord(record) {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  const { data, error } = await supabase
    .from('damaged_records')
    .insert(record)
    .select()
    .single();
  if (error) {
    debug.error(MODULE, 'addDamagedRecord error', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function deleteDamagedRecord(id) {
  const { valid, missing } = validateEnv();
  if (!valid) return { error: 'Env not configured' };
  const { error } = await supabase
    .from('damaged_records')
    .delete()
    .eq('id', id);
  if (error) {
    debug.error(MODULE, 'deleteDamagedRecord error', error);
    return { error: error.message };
  }
  return { error: null };
}

export async function getAutofillData() {
  const { valid, missing } = validateEnv();
  if (!valid) return { data: null, error: 'Env not configured' };
  
  const { data, error } = await supabase
    .from('order_forms')
    .select('technician, assistant_technician, organizer_name, customer_phone, orders(customer_name)');

  if (error) {
    debug.error(MODULE, 'getAutofillData error', error);
    return { data: null, error: error.message };
  }

  const technicians = [...new Set(data.map(item => item.technician).filter(Boolean))];
  const assistants = [...new Set(data.map(item => item.assistant_technician).filter(Boolean))];
  const organizers = [...new Set(data.map(item => item.organizer_name).filter(Boolean))];
  
  const customerMap = {};
  data.forEach(item => {
    const name = item.orders?.customer_name;
    const phone = item.customer_phone;
    if (name && phone) {
      customerMap[name] = phone;
    }
  });

  return {
    data: {
      technicians,
      assistants,
      organizers,
      customers: customerMap
    },
    error: null
  };
}

export async function getWithdrawalRecords() {
  const { data, error } = await supabase
    .from('withdrawal_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { debug.error(MODULE, 'getWithdrawalRecords error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function addWithdrawalRecord(record) {
  const { data, error } = await supabase
    .from('withdrawal_records')
    .insert(record)
    .select()
    .single();
  if (error) { debug.error(MODULE, 'addWithdrawalRecord error', error); return { data: null, error: error.message }; }
  return { data, error: null };
}

export async function getStorageSummary(duration) {
  let startDate = null;
  let endDate = null;

  if (duration === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    startDate = d.toISOString().split('T')[0];
  } else if (duration === 'month') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    startDate = d.toISOString().split('T')[0];
  } else if (duration && typeof duration === 'object' && duration.start) {
    startDate = duration.start;
    endDate = duration.end;
  }

  // 1. Query Confirmed Purchases
  let purchasesQuery = supabase
    .from('purchase_list_items')
    .select('item_type, variant_id_1, variant_id_2, weight_id, quantity, unit, purchase_lists!inner(status, purchase_date)')
    .eq('purchase_lists.status', 'confirmed');

  if (startDate) {
    purchasesQuery = purchasesQuery.gte('purchase_lists.purchase_date', startDate);
  }
  if (endDate) {
    purchasesQuery = purchasesQuery.lte('purchase_lists.purchase_date', endDate);
  }

  // 2. Query Withdrawals
  let withdrawalsQuery = supabase.from('withdrawal_records').select('*');
  if (startDate) {
    withdrawalsQuery = withdrawalsQuery.gte('created_at', startDate + 'T00:00:00Z');
  }
  if (endDate) {
    withdrawalsQuery = withdrawalsQuery.lte('created_at', endDate + 'T23:59:59Z');
  }

  // 3. Query Damages
  let damagesQuery = supabase.from('damaged_records').select('*');
  if (startDate) {
    damagesQuery = damagesQuery.gte('created_at', startDate + 'T00:00:00Z');
  }
  if (endDate) {
    damagesQuery = damagesQuery.lte('created_at', endDate + 'T23:59:59Z');
  }

  // 4. Fetch Active Stocks & Lookups
  const [
    purchasesRes, withdrawalsRes, damagesRes,
    rollsRes, pipesRes, liquidsRes, inksRes, gluesRes,
    widthsRes, typesRes, thicknessesRes,
    companiesRes, colorsRes, liquidTypesRes, glueTypesRes
  ] = await Promise.all([
    purchasesQuery,
    withdrawalsQuery,
    damagesQuery,
    getRolls(),
    getPipes(),
    getLiquids(),
    getInks(),
    getGlues(),
    getRollWidths(),
    getRollTypes(),
    getRollThicknesses(),
    getInkCompanies(),
    getInkColors(),
    getLiquidTypes(),
    getGlueTypes()
  ]);

  if (purchasesRes.error) return { data: null, error: purchasesRes.error.message };
  if (withdrawalsRes.error) return { data: null, error: withdrawalsRes.error.message };
  if (damagesRes.error) return { data: null, error: damagesRes.error.message };

  const purchases = purchasesRes.data || [];
  const withdrawals = withdrawalsRes.data || [];
  const damages = damagesRes.data || [];

  const activeRolls = rollsRes.data || [];
  const activePipes = pipesRes.data || [];
  const activeLiquids = liquidsRes.data || [];
  const activeInks = inksRes.data || [];
  const activeGlues = gluesRes.data || [];

  const widths = widthsRes.data || [];
  const rollTypes = typesRes.data || [];
  const thicknesses = thicknessesRes.data || [];
  const inkCompanies = companiesRes.data || [];
  const inkColors = colorsRes.data || [];
  const liquidTypes = liquidTypesRes.data || [];
  const glueTypes = glueTypesRes.data || [];

  // Helper Maps for quick label lookup
  const widthMap = Object.fromEntries(widths.map(w => [w.id, w.width]));
  const rollTypeMap = Object.fromEntries(rollTypes.map(t => [t.id, t.name]));
  const thicknessMap = Object.fromEntries(thicknesses.map(t => [t.id, t.thickness]));
  const inkCompanyMap = Object.fromEntries(inkCompanies.map(c => [c.id, c.name]));
  const inkColorMap = Object.fromEntries(inkColors.map(c => [c.id, c.name]));
  const liquidTypeMap = Object.fromEntries(liquidTypes.map(t => [t.id, t.name]));
  const glueTypeMap = Object.fromEntries(glueTypes.map(t => [t.id, t.name]));

  // AGGREGATION CONTAINERS
  const summary = {
    rolls: {},
    inks: {},
    liquids: {},
    glues: {},
    pipes: {}
  };

  // --- 1. AGGREGATE ROLLS ---
  const addRollKey = (typeId, thicknessId, widthId) => {
    const key = `${typeId}_${thicknessId}_${widthId}`;
    if (!summary.rolls[key]) {
      const typeName = rollTypeMap[typeId] || 'غير معروف';
      const thickLabel = thicknessMap[thicknessId] || '';
      const widthLabel = widthMap[widthId] || '';
      // Name format: Section Thickness Width (no units)
      const name = `${typeName} ${thickLabel} ${widthLabel}`.trim();
      summary.rolls[key] = {
        key,
        type_id: typeId,
        thickness_id: thicknessId,
        width_id: widthId,
        name,
        type_name: typeName,
        received: 0,
        used: 0,
        available: 0
      };
    }
    return key;
  };

  // Active Rolls (All time available stock)
  activeRolls.forEach(r => {
    if (r.type_id && r.width_id) {
      const key = addRollKey(r.type_id, r.thickness_id, r.width_id);
      summary.rolls[key].available += parseFloat(r.weight) || 0;
    }
  });

  // Roll Purchases (Received within date filter)
  purchases.filter(p => p.item_type === 'roll').forEach(p => {
    if (p.variant_id_1 && p.variant_id_2) {
      const key = addRollKey(p.variant_id_2, p.weight_id, p.variant_id_1);
      summary.rolls[key].received += parseFloat(p.quantity) || 0;
    }
  });

  // Roll Withdrawals (Used within date filter)
  withdrawals.filter(w => w.item_type === 'roll').forEach(w => {
    if (w.variant_id_1 && w.variant_id_3) {
      const key = addRollKey(w.variant_id_3, w.variant_id_2, w.variant_id_1);
      summary.rolls[key].used += parseFloat(w.quantity) || 0;
    }
  });

  // Roll Damages (Used within date filter)
  damages.filter(d => d.item_type === 'roll').forEach(d => {
    const matchingKey = Object.keys(summary.rolls).find(k => {
      const r = summary.rolls[k];
      return r.type_id === d.variant_id_2 && r.width_id === d.variant_id_1;
    });
    if (matchingKey) {
      summary.rolls[matchingKey].used += parseFloat(d.quantity) || 0;
    } else {
      const key = addRollKey(d.variant_id_2, null, d.variant_id_1);
      summary.rolls[key].used += parseFloat(d.quantity) || 0;
    }
  });


  // --- 2. AGGREGATE INKS ---
  const addInkKey = (companyId, colorId) => {
    const key = `${companyId}_${colorId}`;
    if (!summary.inks[key]) {
      const companyName = inkCompanyMap[companyId] || 'غير معروف';
      const colorName = inkColorMap[colorId] || 'غير معروف';
      summary.inks[key] = {
        key,
        company_id: companyId,
        color_id: colorId,
        company_name: companyName,
        color_name: colorName,
        received: 0,
        used: 0,
        available: 0
      };
    }
    return key;
  };

  activeInks.forEach(i => {
    const key = addInkKey(i.company_id, i.color_id);
    summary.inks[key].available += parseFloat(i.quantity) || 0;
  });

  purchases.filter(p => p.item_type === 'ink').forEach(p => {
    const key = addInkKey(p.variant_id_1, p.variant_id_2);
    summary.inks[key].received += parseFloat(p.quantity) || 0;
  });

  withdrawals.filter(w => w.item_type === 'ink').forEach(w => {
    const key = addInkKey(w.variant_id_1, w.variant_id_2);
    summary.inks[key].used += parseFloat(w.quantity) || 0;
  });

  damages.filter(d => d.item_type === 'ink').forEach(d => {
    const key = addInkKey(d.variant_id_1, d.variant_id_2);
    summary.inks[key].used += parseFloat(d.quantity) || 0;
  });


  // --- 3. AGGREGATE LIQUIDS ---
  const addLiquidKey = (typeId) => {
    const key = `${typeId}`;
    if (!summary.liquids[key]) {
      const name = liquidTypeMap[typeId] || 'غير معروف';
      summary.liquids[key] = {
        key,
        type_id: typeId,
        name,
        received: 0,
        used: 0,
        available: 0
      };
    }
    return key;
  };

  activeLiquids.forEach(l => {
    const key = addLiquidKey(l.type_id);
    summary.liquids[key].available += parseFloat(l.quantity) || 0;
  });

  purchases.filter(p => p.item_type === 'liquid').forEach(p => {
    const key = addLiquidKey(p.variant_id_1);
    summary.liquids[key].received += parseFloat(p.quantity) || 0;
  });

  withdrawals.filter(w => w.item_type === 'liquid').forEach(w => {
    const key = addLiquidKey(w.variant_id_1);
    summary.liquids[key].used += parseFloat(w.quantity) || 0;
  });

  damages.filter(d => d.item_type === 'liquid').forEach(d => {
    const key = addLiquidKey(d.variant_id_1);
    summary.liquids[key].used += parseFloat(d.quantity) || 0;
  });


  // --- 4. AGGREGATE GLUES ---
  const addGlueKey = (typeId) => {
    const key = `${typeId}`;
    if (!summary.glues[key]) {
      const name = glueTypeMap[typeId] || 'غير معروف';
      summary.glues[key] = {
        key,
        type_id: typeId,
        name,
        received: 0,
        used: 0,
        available: 0
      };
    }
    return key;
  };

  activeGlues.forEach(g => {
    const key = addGlueKey(g.type_id);
    summary.glues[key].available += parseFloat(g.quantity) || 0;
  });

  purchases.filter(p => p.item_type === 'glue').forEach(p => {
    const key = addGlueKey(p.variant_id_1);
    summary.glues[key].received += parseFloat(p.quantity) || 0;
  });

  withdrawals.filter(w => w.item_type === 'glue').forEach(w => {
    const key = addGlueKey(w.variant_id_1);
    summary.glues[key].used += parseFloat(w.quantity) || 0;
  });

  damages.filter(d => d.item_type === 'glue').forEach(d => {
    const key = addGlueKey(d.variant_id_1);
    summary.glues[key].used += parseFloat(d.quantity) || 0;
  });


  // --- 5. AGGREGATE PIPES ---
  const addPipeKey = (lengthId) => {
    const key = `${lengthId}`;
    if (!summary.pipes[key]) {
      const activePipeObj = activePipes.find(ap => ap.length_id === lengthId);
      const lengthVal = activePipeObj?.length_label || `${lengthId}`;
      summary.pipes[key] = {
        key,
        length_id: lengthId,
        length: lengthVal,
        received: 0,
        used: 0,
        available: 0,
        available_weight: 0
      };
    }
    return key;
  };

  activePipes.forEach(p => {
    const key = addPipeKey(p.length_id);
    summary.pipes[key].available += p.quantity || 0;
    // Extract pipe weight from notes if logged (e.g. "weight: 0.95")
    const weightMatch = p.notes?.match(/weight:\s*([0-9.]+)/i);
    const pipeWeight = weightMatch ? parseFloat(weightMatch[1]) : 0;
    summary.pipes[key].available_weight = (p.quantity || 0) * pipeWeight;
  });

  purchases.filter(p => p.item_type === 'pipe').forEach(p => {
    const key = addPipeKey(p.variant_id_1);
    summary.pipes[key].received += parseInt(p.quantity) || 0;
  });

  withdrawals.filter(w => w.item_type === 'pipe').forEach(w => {
    const key = addPipeKey(w.variant_id_1);
    summary.pipes[key].used += parseInt(w.quantity) || 0;
  });

  damages.filter(d => d.item_type === 'pipe').forEach(d => {
    const key = addPipeKey(d.variant_id_1);
    summary.pipes[key].used += parseInt(d.quantity) || 0;
  });

  return {
    data: {
      rolls: Object.values(summary.rolls),
      inks: Object.values(summary.inks),
      liquids: Object.values(summary.liquids),
      glues: Object.values(summary.glues),
      pipes: Object.values(summary.pipes)
    },
    error: null
  };
}



