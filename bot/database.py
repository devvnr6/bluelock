import aiosqlite
import asyncio
from datetime import datetime
import json

class Database:
    def __init__(self, db_path='balkan_gov.db'):
        self.db_path = db_path
        
    async def connect(self):
        """Initialize database connection and create tables"""
        self.db = await aiosqlite.connect(self.db_path)
        await self.create_tables()
        
    async def create_tables(self):
        """Create all necessary tables"""
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS laws (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                proposed_by INTEGER NOT NULL,
                proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                votes_for INTEGER DEFAULT 0,
                votes_against INTEGER DEFAULT 0,
                enacted_at TIMESTAMP
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                law_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                vote TEXT NOT NULL,
                voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (law_id) REFERENCES laws (id),
                UNIQUE(law_id, user_id)
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS alliances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nation TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                created_by INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS wars (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_nation TEXT NOT NULL,
                declared_by INTEGER NOT NULL,
                declared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active',
                ended_at TIMESTAMP
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS trade_agreements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nation TEXT NOT NULL,
                resource TEXT NOT NULL,
                amount INTEGER,
                created_by INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS sanctions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nation TEXT NOT NULL,
                imposed_by INTEGER NOT NULL,
                imposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active',
                lifted_at TIMESTAMP
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS economy (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tax_rate INTEGER DEFAULT 10,
                budget INTEGER DEFAULT 100000,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS resources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                resource_type TEXT NOT NULL UNIQUE,
                amount INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS military_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_type TEXT NOT NULL,
                target TEXT,
                unit_type TEXT,
                issued_by INTEGER NOT NULL,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )
        ''')
        
        await self.db.execute('''
            CREATE TABLE IF NOT EXISTS espionage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_nation TEXT NOT NULL,
                initiated_by INTEGER NOT NULL,
                initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'in_progress',
                result TEXT
            )
        ''')
        
        await self.db.commit()
        
    async def close(self):
        """Close database connection"""
        await self.db.close()
        
    # Law Management
    async def create_law(self, title, description, proposed_by):
        cursor = await self.db.execute(
            'INSERT INTO laws (title, description, proposed_by) VALUES (?, ?, ?)',
            (title, description, proposed_by)
        )
        await self.db.commit()
        return cursor.lastrowid
        
    async def get_law(self, law_id):
        cursor = await self.db.execute('SELECT * FROM laws WHERE id = ?', (law_id,))
        return await cursor.fetchone()
        
    async def get_pending_laws(self):
        cursor = await self.db.execute('SELECT * FROM laws WHERE status = "pending"')
        return await cursor.fetchall()
        
    async def vote_on_law(self, law_id, user_id, vote):
        try:
            await self.db.execute(
                'INSERT INTO votes (law_id, user_id, vote) VALUES (?, ?, ?)',
                (law_id, user_id, vote)
            )
            
            # Update vote counts
            if vote == 'for':
                await self.db.execute('UPDATE laws SET votes_for = votes_for + 1 WHERE id = ?', (law_id,))
            else:
                await self.db.execute('UPDATE laws SET votes_against = votes_against + 1 WHERE id = ?', (law_id,))
                
            await self.db.commit()
            return True
        except aiosqlite.IntegrityError:
            return False  # User already voted
            
    async def enact_law(self, law_id):
        await self.db.execute(
            'UPDATE laws SET status = "enacted", enacted_at = CURRENT_TIMESTAMP WHERE id = ?',
            (law_id,)
        )
        await self.db.commit()
        
    # Alliance Management
    async def create_alliance(self, nation, created_by):
        cursor = await self.db.execute(
            'INSERT INTO alliances (nation, created_by) VALUES (?, ?)',
            (nation, created_by)
        )
        await self.db.commit()
        return cursor.lastrowid
        
    async def get_alliances(self):
        cursor = await self.db.execute('SELECT * FROM alliances WHERE status = "active"')
        return await cursor.fetchall()
        
    async def end_alliance(self, nation):
        await self.db.execute(
            'UPDATE alliances SET status = "ended", ended_at = CURRENT_TIMESTAMP WHERE nation = ? AND status = "active"',
            (nation,)
        )
        await self.db.commit()
        
    # War Management
    async def declare_war(self, target_nation, declared_by):
        cursor = await self.db.execute(
            'INSERT INTO wars (target_nation, declared_by) VALUES (?, ?)',
            (target_nation, declared_by)
        )
        await self.db.commit()
        return cursor.lastrowid
        
    async def get_active_wars(self):
        cursor = await self.db.execute('SELECT * FROM wars WHERE status = "active"')
        return await cursor.fetchall()
        
    async def end_war(self, war_id):
        await self.db.execute(
            'UPDATE wars SET status = "ended", ended_at = CURRENT_TIMESTAMP WHERE id = ?',
            (war_id,)
        )
        await self.db.commit()
        
    # Trade Management
    async def create_trade(self, nation, resource, amount, created_by):
        cursor = await self.db.execute(
            'INSERT INTO trade_agreements (nation, resource, amount, created_by) VALUES (?, ?, ?, ?)',
            (nation, resource, amount, created_by)
        )
        await self.db.commit()
        return cursor.lastrowid
        
    async def get_trades(self):
        cursor = await self.db.execute('SELECT * FROM trade_agreements WHERE status = "active"')
        return await cursor.fetchall()
        
    # Sanctions
    async def impose_sanction(self, nation, imposed_by):
        cursor = await self.db.execute(
            'INSERT INTO sanctions (nation, imposed_by) VALUES (?, ?)',
            (nation, imposed_by)
        )
        await self.db.commit()
        return cursor.lastrowid
        
    async def get_sanctions(self):
        cursor = await self.db.execute('SELECT * FROM sanctions WHERE status = "active"')
        return await cursor.fetchall()
        
    async def lift_sanction(self, nation):
        await self.db.execute(
            'UPDATE sanctions SET status = "lifted", lifted_at = CURRENT_TIMESTAMP WHERE nation = ? AND status = "active"',
            (nation,)
        )
        await self.db.commit()
        
    # Economy
    async def set_tax_rate(self, rate):
        await self.db.execute('INSERT OR REPLACE INTO economy (id, tax_rate) VALUES (1, ?)', (rate,))
        await self.db.commit()
        
    async def get_economy(self):
        cursor = await self.db.execute('SELECT * FROM economy WHERE id = 1')
        result = await cursor.fetchone()
        if not result:
            await self.db.execute('INSERT INTO economy (id) VALUES (1)')
            await self.db.commit()
            cursor = await self.db.execute('SELECT * FROM economy WHERE id = 1')
            result = await cursor.fetchone()
        return result
        
    # Resources
    async def set_resource(self, resource_type, amount):
        await self.db.execute(
            'INSERT OR REPLACE INTO resources (resource_type, amount, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            (resource_type, amount)
        )
        await self.db.commit()
        
    async def get_resources(self):
        cursor = await self.db.execute('SELECT * FROM resources')
        return await cursor.fetchall()
        
    # Military Actions
    async def log_military_action(self, action_type, target, unit_type, issued_by):
        cursor = await self.db.execute(
            'INSERT INTO military_actions (action_type, target, unit_type, issued_by) VALUES (?, ?, ?, ?)',
            (action_type, target, unit_type, issued_by)
        )
        await self.db.commit()
        return cursor.lastrowid
        
    # Espionage
    async def create_espionage(self, target_nation, initiated_by):
        cursor = await self.db.execute(
            'INSERT INTO espionage (target_nation, initiated_by) VALUES (?, ?)',
            (target_nation, initiated_by)
        )
        await self.db.commit()
        return cursor.lastrowid
