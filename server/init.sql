-- MariaDB-ready schema (use MariaDB 10.2+ for JSON type)
CREATE TABLE IF NOT EXISTS `diagrams` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `database_type` VARCHAR(255) NOT NULL,
  `database_edition` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `db_tables` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `diagram_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `schema` VARCHAR(255),
  `x` FLOAT,
  `y` FLOAT,
  `fields` JSON,
  `indexes` JSON,
  `color` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `width` FLOAT,
  `comment` TEXT,
  `is_view` BOOLEAN DEFAULT FALSE,
  `is_materialized_view` BOOLEAN DEFAULT FALSE,
  `order` FLOAT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `db_relationships` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `diagram_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255),
  `source_schema` VARCHAR(255),
  `source_table_id` VARCHAR(255) NOT NULL,
  `target_schema` VARCHAR(255),
  `target_table_id` VARCHAR(255) NOT NULL,
  `source_field_id` VARCHAR(255),
  `target_field_id` VARCHAR(255),
  `type` VARCHAR(255),
  `source_cardinality` VARCHAR(255),
  `target_cardinality` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `db_dependencies` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `diagram_id` VARCHAR(255) NOT NULL,
  `schema` VARCHAR(255),
  `table_id` VARCHAR(255) NOT NULL,
  `dependent_schema` VARCHAR(255),
  `dependent_table_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `areas` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `diagram_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `x` FLOAT,
  `y` FLOAT,
  `width` FLOAT,
  `height` FLOAT,
  `color` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `db_custom_types` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `diagram_id` VARCHAR(255) NOT NULL,
  `schema` VARCHAR(255),
  `type` VARCHAR(255) NOT NULL,
  `kind` VARCHAR(255),
  `values` JSON,
  `fields` JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `config` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `default_diagram_id` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `diagram_filters` (
  `diagram_id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `table_ids` JSON,
  `schemas_ids` JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;