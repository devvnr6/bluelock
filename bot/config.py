import os
from dotenv import load_dotenv

load_dotenv()

# Discord Configuration
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
GUILD_ID = int(os.getenv('GUILD_ID', 0))

# Roblox Integration
ROBLOX_GAME_ID = os.getenv('ROBLOX_GAME_ID')
ROBLOX_API_KEY = os.getenv('ROBLOX_API_KEY')

# Role IDs
PRESIDENT_ROLE_ID = int(os.getenv('PRESIDENT_ROLE_ID', 0))
MINISTER_ROLE_ID = int(os.getenv('MINISTER_ROLE_ID', 0))
COUNCIL_MEMBER_ROLE_ID = int(os.getenv('COUNCIL_MEMBER_ROLE_ID', 0))
MILITARY_ROLE_ID = int(os.getenv('MILITARY_ROLE_ID', 0))

# Channel IDs
GOVERNMENT_CHANNEL_ID = int(os.getenv('GOVERNMENT_CHANNEL_ID', 0))
VOTING_CHANNEL_ID = int(os.getenv('VOTING_CHANNEL_ID', 0))
ANNOUNCEMENTS_CHANNEL_ID = int(os.getenv('ANNOUNCEMENTS_CHANNEL_ID', 0))

# Voting Configuration
VOTE_DURATION = 300  # 5 minutes in seconds
VOTE_THRESHOLD = 0.5  # 50% approval needed

# Economy Configuration
DEFAULT_TAX_RATE = 10
MAX_TAX_RATE = 50
MIN_TAX_RATE = 0

# Resources
RESOURCES = ['oil', 'food', 'minerals', 'steel', 'coal', 'gold']

# Nations (can be expanded)
NATIONS = ['serbia', 'croatia', 'bosnia', 'slovenia', 'montenegro', 'macedonia', 'albania', 'bulgaria', 'romania', 'greece']
