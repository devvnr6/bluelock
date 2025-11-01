import discord
from discord.ext import commands
from discord import app_commands
import config
from datetime import datetime

class Military(commands.Cog):
    """Military Control Commands"""
    
    def __init__(self, bot):
        self.bot = bot
        self.db = bot.db
        self.roblox = bot.roblox
        
    @app_commands.command(name="declarewar", description="Declare war on another nation")
    @app_commands.describe(nation="Nation to declare war on")
    async def declare_war(self, interaction: discord.Interaction, nation: str):
        """Declare war (President/Minister of Defense only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can declare war!", ephemeral=True)
            return
            
        nation = nation.lower()
        if nation not in config.NATIONS:
            await interaction.response.send_message(
                f"? Invalid nation! Valid nations: {', '.join(config.NATIONS)}",
                ephemeral=True
            )
            return
            
        # Check if already at war
        active_wars = await self.db.get_active_wars()
        for war in active_wars:
            if war[1] == nation:  # target_nation
                await interaction.response.send_message(f"? Already at war with {nation.title()}!", ephemeral=True)
                return
                
        # Record in database
        war_id = await self.db.declare_war(nation, interaction.user.id)
        
        # Send to Roblox
        success, message = await self.roblox.declare_war(nation, interaction.user.display_name)
        
        # Announce
        embed = discord.Embed(
            title="?? WAR DECLARED",
            description=f"**War has been declared against {nation.title()}!**",
            color=discord.Color.red(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Declared by", value=interaction.user.mention)
        embed.add_field(name="Target Nation", value=nation.title())
        embed.add_field(name="War ID", value=f"#{war_id}")
        embed.add_field(name="Roblox Status", value="? Active" if success else "?? Pending")
        embed.set_footer(text="All military units are now mobilized")
        
        channel = self.bot.get_channel(config.ANNOUNCEMENTS_CHANNEL_ID)
        if channel:
            await channel.send("@everyone", embed=embed)
            
        await interaction.response.send_message(f"? War declared against {nation.title()}!", ephemeral=True)
        
    @app_commands.command(name="mobilize", description="Mobilize military units")
    @app_commands.describe(
        unit_type="Type of unit to mobilize",
        amount="Number of units",
        location="Where to mobilize"
    )
    async def mobilize(self, interaction: discord.Interaction, unit_type: str, amount: int, location: str):
        """Mobilize troops (Military/Government roles)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID, config.MILITARY_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? You need military clearance to mobilize troops!", ephemeral=True)
            return
            
        # Log action
        await self.db.log_military_action("mobilize", location, unit_type, interaction.user.id)
        
        # Send to Roblox
        success, message = await self.roblox.mobilize_troops(unit_type, amount, location)
        
        embed = discord.Embed(
            title="?? TROOP MOBILIZATION",
            description=f"**{amount}x {unit_type}** are being mobilized!",
            color=discord.Color.dark_blue(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Ordered by", value=interaction.user.mention)
        embed.add_field(name="Unit Type", value=unit_type)
        embed.add_field(name="Amount", value=str(amount))
        embed.add_field(name="Location", value=location)
        embed.add_field(name="Status", value="? Mobilized" if success else "?? Pending")
        
        channel = self.bot.get_channel(config.GOVERNMENT_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? Mobilizing {amount}x {unit_type} to {location}!", ephemeral=True)
        
    @app_commands.command(name="deploy", description="Deploy troops to a location")
    @app_commands.describe(
        unit_type="Type of unit to deploy",
        location="Target location"
    )
    async def deploy(self, interaction: discord.Interaction, unit_type: str, location: str):
        """Deploy troops (Military/Government roles)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID, config.MILITARY_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? You need military clearance to deploy troops!", ephemeral=True)
            return
            
        # Log action
        await self.db.log_military_action("deploy", location, unit_type, interaction.user.id)
        
        # Send to Roblox
        success, message = await self.roblox.deploy_troops(unit_type, location)
        
        embed = discord.Embed(
            title="?? TROOP DEPLOYMENT",
            description=f"**{unit_type}** units are being deployed!",
            color=discord.Color.dark_green(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Ordered by", value=interaction.user.mention)
        embed.add_field(name="Unit Type", value=unit_type)
        embed.add_field(name="Destination", value=location)
        embed.add_field(name="Status", value="? En Route" if success else "?? Pending")
        
        await interaction.response.send_message(embed=embed)
        
    @app_commands.command(name="defense", description="Set national defense status")
    @app_commands.describe(status="Defense posture")
    @app_commands.choices(status=[
        app_commands.Choice(name="Passive", value="passive"),
        app_commands.Choice(name="Active", value="active"),
        app_commands.Choice(name="High Alert", value="high_alert"),
        app_commands.Choice(name="DEFCON 1", value="defcon1")
    ])
    async def defense(self, interaction: discord.Interaction, status: str):
        """Set defense status (President/Ministers only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can change defense status!", ephemeral=True)
            return
            
        # Send to Roblox
        success, message = await self.roblox.set_defense_status(status)
        
        status_colors = {
            "passive": discord.Color.green(),
            "active": discord.Color.yellow(),
            "high_alert": discord.Color.orange(),
            "defcon1": discord.Color.red()
        }
        
        embed = discord.Embed(
            title=f"??? DEFENSE STATUS: {status.upper().replace('_', ' ')}",
            description=f"National defense posture has been set to **{status.upper()}**",
            color=status_colors.get(status, discord.Color.blue()),
            timestamp=datetime.now()
        )
        embed.add_field(name="Ordered by", value=interaction.user.mention)
        embed.add_field(name="Status", value="? Active" if success else "?? Pending")
        
        channel = self.bot.get_channel(config.ANNOUNCEMENTS_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? Defense status set to {status}!", ephemeral=True)
        
    @app_commands.command(name="endwar", description="End an active war")
    @app_commands.describe(war_id="ID of the war to end")
    async def end_war(self, interaction: discord.Interaction, war_id: int):
        """End a war (President only)"""
        if not any(role.id == config.PRESIDENT_ROLE_ID for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President can end wars!", ephemeral=True)
            return
            
        await self.db.end_war(war_id)
        
        embed = discord.Embed(
            title="??? WAR ENDED",
            description=f"War #{war_id} has been concluded.",
            color=discord.Color.green(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Concluded by", value=interaction.user.mention)
        
        channel = self.bot.get_channel(config.ANNOUNCEMENTS_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? War #{war_id} has ended!", ephemeral=True)
        
    @app_commands.command(name="wars", description="View all active wars")
    async def view_wars(self, interaction: discord.Interaction):
        """View active wars"""
        wars = await self.db.get_active_wars()
        
        if not wars:
            await interaction.response.send_message("No active wars.", ephemeral=True)
            return
            
        embed = discord.Embed(
            title="?? Active Wars",
            color=discord.Color.red()
        )
        
        for war in wars:
            war_id, target_nation, declared_by, declared_at, status, ended_at = war
            user = self.bot.get_user(declared_by)
            embed.add_field(
                name=f"War #{war_id}",
                value=f"**Against:** {target_nation.title()}\n**Declared by:** {user.mention if user else 'Unknown'}\n**Since:** {declared_at}",
                inline=False
            )
            
        await interaction.response.send_message(embed=embed)

async def setup(bot):
    await bot.add_cog(Military(bot))
