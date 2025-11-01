import discord
from discord.ext import commands
import asyncio
import config
from database import Database
from roblox_integration import RobloxIntegration

class BalkanGovernmentBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        intents.guilds = True
        
        super().__init__(
            command_prefix='!',
            intents=intents,
            application_id=None
        )
        
        self.db = None
        self.roblox = None
        
    async def setup_hook(self):
        """Setup hook for loading extensions and database"""
        # Initialize database
        self.db = Database()
        await self.db.connect()
        print("? Database connected")
        
        # Initialize Roblox integration
        self.roblox = RobloxIntegration()
        print("? Roblox integration initialized")
        
        # Load cogs
        cogs = [
            'cogs.government',
            'cogs.military',
            'cogs.diplomacy',
            'cogs.economy'
        ]
        
        for cog in cogs:
            try:
                await self.load_extension(cog)
                print(f"? Loaded {cog}")
            except Exception as e:
                print(f"? Failed to load {cog}: {e}")
                
        # Sync commands with Discord
        try:
            if config.GUILD_ID:
                guild = discord.Object(id=config.GUILD_ID)
                self.tree.copy_global_to(guild=guild)
                await self.tree.sync(guild=guild)
                print(f"? Commands synced to guild {config.GUILD_ID}")
            else:
                await self.tree.sync()
                print("? Commands synced globally")
        except Exception as e:
            print(f"?? Failed to sync commands: {e}")
            
    async def on_ready(self):
        """Called when bot is ready"""
        print(f"????????????????????????????????????????")
        print(f"???? Balkan Government Bot Online ????")
        print(f"????????????????????????????????????????")
        print(f"Bot: {self.user.name} (ID: {self.user.id})")
        print(f"Servers: {len(self.guilds)}")
        print(f"Discord.py: {discord.__version__}")
        print(f"????????????????????????????????????????")
        
        # Set bot presence
        await self.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name="the Balkan Government"
            )
        )
        
    async def on_command_error(self, ctx, error):
        """Global error handler"""
        if isinstance(error, commands.CommandNotFound):
            return
        elif isinstance(error, commands.MissingPermissions):
            await ctx.send("? You don't have permission to use this command!")
        elif isinstance(error, commands.MissingRequiredArgument):
            await ctx.send(f"? Missing required argument: {error.param}")
        else:
            print(f"Error: {error}")
            await ctx.send("? An error occurred while executing the command.")
            
    async def close(self):
        """Cleanup when bot shuts down"""
        if self.db:
            await self.db.close()
            print("? Database closed")
        await super().close()

async def main():
    """Main entry point"""
    bot = BalkanGovernmentBot()
    
    try:
        await bot.start(config.DISCORD_TOKEN)
    except KeyboardInterrupt:
        print("\n?? Shutting down...")
        await bot.close()
    except Exception as e:
        print(f"? Fatal error: {e}")
        await bot.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n?? Goodbye!")
