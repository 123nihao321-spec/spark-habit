-- 1. 创建商品表
CREATE TABLE IF NOT EXISTS store_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  cost INTEGER,
  icon TEXT,
  desc TEXT,
  created_at INTEGER
);

-- 2. 创建交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  user_name TEXT,
  user_avatar TEXT,
  item_name TEXT,
  item_icon TEXT,
  cost INTEGER,
  timestamp INTEGER,
  date_str TEXT
);

-- 3. 插入初始商品数据
INSERT INTO store_items (name, cost, icon, desc, created_at) VALUES 
('补签卡', 50, '🎟️', '弥补一天的遗憾', 1700000000),
('奶茶券', 200, '🧋', '奖励自己一杯奶茶', 1700000000);