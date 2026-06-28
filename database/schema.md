## Table `app_users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `username` | `text` |  Unique |
| `password` | `text` |  |
| `role` | `text` |  |
| `created_at` | `timestamptz` |  |

## Table `ready_orders`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `pipe_length` | `numeric` |  |
| `pipe_weight` | `numeric` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `status` | `text` |  |
| `order_id` | `int4` |  Nullable |

## Table `ready_order_rolls`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `order_id` | `uuid` |  |
| `weight` | `numeric` |  |
| `created_at` | `timestamptz` |  |

## Table `roll_types`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `name` | `text` |  Unique |
| `created_at` | `timestamptz` |  |

## Table `rolls`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `type_id` | `int4` |  |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `width_id` | `int4` |  Nullable |
| `weight` | `numeric` |  |
| `purchase_list_item_id` | `int4` |  Nullable |

## Table `pipe_lengths`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `length` | `numeric` |  Unique |
| `created_at` | `timestamptz` |  |

## Table `pipes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `length_id` | `int4` |  Unique |
| `quantity` | `int4` |  |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `liquid_types`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `name` | `text` |  Unique |
| `created_at` | `timestamptz` |  |

## Table `liquids`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `type_id` | `int4` |  Unique |
| `quantity` | `numeric` |  |
| `unit` | `text` |  |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `ink_companies`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `name` | `text` |  Unique |
| `created_at` | `timestamptz` |  |

## Table `ink_colors`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `name` | `text` |  Unique |
| `created_at` | `timestamptz` |  |

## Table `inks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `company_id` | `int4` |  |
| `color_id` | `int4` |  |
| `quantity` | `numeric` |  |
| `unit` | `text` |  |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `purchase_offices`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `name` | `text` |  Unique |
| `created_at` | `timestamptz` |  |

## Table `purchase_lists`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `office_id` | `int4` |  |
| `purchase_date` | `date` |  |
| `notes` | `text` |  Nullable |
| `status` | `text` |  |
| `created_by` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `company_number` | `text` |  Nullable |

## Table `purchase_list_items`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `purchase_list_id` | `int4` |  |
| `item_type` | `text` |  |
| `variant_id_1` | `int4` |  |
| `variant_id_2` | `int4` |  Nullable |
| `quantity` | `numeric` |  |
| `unit` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `weight_id` | `int4` |  Nullable |

## Table `roll_widths`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `width` | `numeric` |  Unique |
| `created_at` | `timestamptz` |  |

## Table `ink_weights`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `weight` | `numeric` |  Unique |
| `created_at` | `timestamptz` |  |

## Table `orders`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `customer_name` | `text` |  |
| `order_date` | `date` |  |
| `details` | `text` |  Nullable |
| `status` | `text` |  |
| `created_by` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `order_forms`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `order_id` | `int8` |  |
| `technician` | `text` |  |
| `assistant_technician` | `text` |  |
| `shift` | `text` |  |
| `order_number` | `int8` |  Identity |
| `customer_phone` | `text` |  |
| `organizer_name` | `text` |  |
| `functional_desc` | `text` |  |
| `weight_kg` | `numeric` |  |
| `fasoon` | `bool` |  |
| `job_types` | `_text` |  |
| `production_length` | `numeric` |  |
| `production_width` | `numeric` |  |
| `design_source` | `text` |  |
| `clishe_source` | `text` |  |
| `print_style` | `text` |  |
| `print_subtype` | `text` |  |
| `material` | `text` |  |
| `mic_value` | `numeric` |  |
| `print_quantity` | `int4` |  |
| `print_color_count` | `int4` |  |
| `material_measure` | `numeric` |  |
| `lamination_needed` | `bool` |  |
| `lamination_mat1` | `text` |  Nullable |
| `lamination_meas1` | `numeric` |  Nullable |
| `lamination_mic1` | `numeric` |  Nullable |
| `lamination_mat2` | `text` |  Nullable |
| `lamination_meas2` | `numeric` |  Nullable |
| `lamination_mic2` | `numeric` |  Nullable |
| `lamination_mat3` | `text` |  Nullable |
| `lamination_meas3` | `numeric` |  Nullable |
| `lamination_mic3` | `numeric` |  Nullable |
| `glue_type` | `text` |  |
| `cutting_needed` | `bool` |  |
| `packaging_needed` | `bool` |  |
| `wrap_shape` | `text` |  |
| `wrap_diameter` | `numeric` |  |
| `wrap_weight` | `numeric` |  |
| `delivery_location` | `text` |  |
| `payment_method` | `text` |  |
| `payment_details` | `text` |  |
| `total_amount` | `numeric` |  |
| `extra_details` | `text` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `print_settings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `settings` | `jsonb` |  |
| `updated_at` | `timestamptz` |  |

## Table `user_permissions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `uuid` | Primary |
| `allowed_tabs` | `_text` |  |

