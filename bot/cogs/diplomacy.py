import discord
from discord.ext import commands
from discord import app_commands
import config
from datetime import datetime

class Diplomacy(commands.Cog):
    """Diplomacy and Trade Commands"""
    
    def __init__(self, bot):
        self.bot = bot
        self.db = bot.db
        self.roblox = bot.roblox
        
    @app_commands.command(name="alliance", description="Form or break an alliance")
    @app_commands.describe(
        nation="Nation to form/break alliance with",
        action="Form or break alliance"
    )
    @app_commands.choices(action=[
        app_commands.Choice(name="Form", value="form"),
        app_commands.Choice(name="Break", value="break")
    ])
    async def alliance(self, interaction: discord.Interaction, nation: str, action: str):
        """Manage alliances (President/Foreign Minister only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can manage alliances!", ephemeral=True)
            return
            
        nation = nation.lower()
        if nation not in config.NATIONS:
            await interaction.response.send_message(
                f"? Invalid nation! Valid nations: {', '.join(config.NATIONS)}",
                ephemeral=True
            )
            return
            
        if action == "form":
            # Check for existing alliance
            alliances = await self.db.get_alliances()
            for alliance in alliances:
                if alliance[1] == nation:  # nation field
                    await interaction.response.send_message(f"? Already in alliance with {nation.title()}!", ephemeral=True)
                    return
                    
            # Create alliance
            alliance_id = await self.db.create_alliance(nation, interaction.user.id)
            
            # Send to Roblox
            success, message = await self.roblox.create_alliance(nation)
            
            embed = discord.Embed(
                title="?? ALLIANCE FORMED",
                description=f"**Alliance established with {nation.title()}!**",
                color=discord.Color.blue(),
                timestamp=datetime.now()
            )
            embed.add_field(name="Formed by", value=interaction.user.mention)
            embed.add_field(name="Alliance ID", value=f"#{alliance_id}")
            embed.add_field(name="Status", value="? Active" if success else "?? Pending")
            
            channel = self.bot.get_channel(config.ANNOUNCEMENTS_CHANNEL_ID)
            if channel:
                await channel.send(embed=embed)
                
            await interaction.response.send_message(f"? Alliance formed with {nation.title()}!", ephemeral=True)
            
        else:  # break
            await self.db.end_alliance(nation)
            
            # Send to Roblox
            success, message = await self.roblox.break_alliance(nation)
            
            embed = discord.Embed(
                title="?? ALLIANCE BROKEN",
                description=f"**Alliance with {nation.title()} has been terminated!**",
                color=discord.Color.red(),
                timestamp=datetime.now()
            )
            embed.add_field(name="Terminated by", value=interaction.user.mention)
            embed.add_field(name="Status", value="? Terminated" if success else "?? Pending")
            
            channel = self.bot.get_channel(config.ANNOUNCEMENTS_CHANNEL_ID)
            if channel:
                await channel.send(embed=embed)
                
            await interaction.response.send_message(f"? Alliance with {nation.title()} broken!", ephemeral=True)
            
    @app_commands.command(name="trade", description="Establish trade agreement")
    @app_commands.describe(
        nation="Nation to trade with",
        resource="Resource to trade",
        amount="Amount of resource"
    )
    async def trade(self, interaction: discord.Interaction, nation: str, resource: str, amount: int):
        """Create trade agreement (President/Economy Minister only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can negotiate trade!", ephemeral=True)
            return
            
        nation = nation.lower()
        resource = resource.lower()
        
        if nation not in config.NATIONS:
            await interaction.response.send_message(
                f"? Invalid nation! Valid nations: {', '.join(config.NATIONS)}",
                ephemeral=True
            )
            return
            
        if resource not in config.RESOURCES:
            await interaction.response.send_message(
                f"? Invalid resource! Valid resources: {', '.join(config.RESOURCES)}",
                ephemeral=True
            )
            return
            
        # Create trade agreement
        trade_id = await self.db.create_trade(nation, resource, amount, interaction.user.id)
        
        # Send to Roblox
        success, message = await self.roblox.establish_trade(nation, resource, amount)
        
        embed = discord.Embed(
            title="?? TRADE AGREEMENT",
            description=f"**Trade route established with {nation.title()}!**",
            color=discord.Color.gold(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Negotiated by", value=interaction.user.mention)
        embed.add_field(name="Nation", value=nation.title())
        embed.add_field(name="Resource", value=resource.title())
        embed.add_field(name="Amount", value=str(amount))
        embed.add_field(name="Trade ID", value=f"#{trade_id}")
        embed.add_field(name="Status", value="? Active" if success else "?? Pending")
        
        channel = self.bot.get_channel(config.GOVERNMENT_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? Trade agreement established with {nation.title()}!", ephemeral=True)
        
    @app_commands.command(name="sanction", description="Impose or lift sanctions")
    @app_commands.describe(
        nation="Nation to sanction",
        action="Impose or lift sanctions"
    )
    @app_commands.choices(action=[
        app_commands.Choice(name="Impose", value="impose"),
        app_commands.Choice(name="Lift", value="lift")
    ])
    async def sanction(self, interaction: discord.Interaction, nation: str, action: str):
        """Manage sanctions (President/Foreign Minister only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can impose sanctions!", ephemeral=True)
            return
            
        nation = nation.lower()
        if nation not in config.NATIONS:
            await interaction.response.send_message(
                f"? Invalid nation! Valid nations: {', '.join(config.NATIONS)}",
                ephemeral=True
            )
            return
            
        if action == "impose":
            # Check for existing sanctions
            sanctions = await self.db.get_sanctions()
            for sanction in sanctions:
                if sanction[1] == nation:  # nation field
                    await interaction.response.send_message(f"? Sanctions already imposed on {nation.title()}!", ephemeral=True)
                    return
                    
            # Impose sanctions
            sanction_id = await self.db.impose_sanction(nation, interaction.user.id)
            
            # Send to Roblox
            success, message = await self.roblox.impose_sanction(nation)
            
            embed = discord.Embed(
                title="?? SANCTIONS IMPOSED",
                description=f"**Economic sanctions imposed on {nation.title()}!**",
                color=discord.Color.dark_red(),
                timestamp=datetime.now()
            )
            embed.add_field(name="Imposed by", value=interaction.user.mention)
            embed.add_field(name="Sanction ID", value=f"#{sanction_id}")
            embed.add_field(name="Status", value="? Active" if success else "?? Pending")
            
        else:  # lift
            await self.db.lift_sanction(nation)
            
            embed = discord.Embed(
                title="? SANCTIONS LIFTED",
                description=f"**Economic sanctions on {nation.title()} have been lifted!**",
                color=discord.Color.green(),
                timestamp=datetime.now()
            )
            embed.add_field(name="Lifted by", value=interaction.user.mention)
            
        channel = self.bot.get_channel(config.ANNOUNCEMENTS_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? Sanctions {action}d on {nation.title()}!", ephemeral=True)
        
    @app_commands.command(name="espionage", description="Initiate covert espionage mission")
    @app_commands.describe(nation="Target nation for espionage")
    async def espionage(self, interaction: discord.Interaction, nation: str):
        """Start espionage mission (President/Ministers only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can order espionage!", ephemeral=True)
            return
            
        nation = nation.lower()
        if nation not in config.NATIONS:
            await interaction.response.send_message(
                f"? Invalid nation! Valid nations: {', '.join(config.NATIONS)}",
                ephemeral=True
            )
            return
            
        # Create espionage mission
        mission_id = await self.db.create_espionage(nation, interaction.user.id)
        
        # Send to Roblox
        success, message = await self.roblox.initiate_espionage(nation)
        
        embed = discord.Embed(
            title="??? CLASSIFIED: ESPIONAGE INITIATED",
            description=f"**Covert operation launched against {nation.title()}**",
            color=discord.Color.dark_gray(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Authorized by", value=interaction.user.mention)
        embed.add_field(name="Mission ID", value=f"#{mission_id}")
        embed.add_field(name="Status", value="?? In Progress" if success else "?? Pending")
        embed.set_footer(text="?? CLASSIFIED - This operation is confidential")
        
        # Send privately to government channel
        channel = self.bot.get_channel(config.GOVERNMENT_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? Espionage mission #{mission_id} initiated against {nation.title()}!", ephemeral=True)
        
    @app_commands.command(name="alliances", description="View all active alliances")
    async def view_alliances(self, interaction: discord.Interaction):
        """View alliances"""
        alliances = await self.db.get_alliances()
        
        if not alliances:
            await interaction.response.send_message("No active alliances.", ephemeral=True)
            return
            
        embed = discord.Embed(
            title="?? Active Alliances",
            color=discord.Color.blue()
        )
        
        for alliance in alliances:
            alliance_id, nation, status, created_by, created_at, ended_at = alliance
            user = self.bot.get_user(created_by)
            embed.add_field(
                name=f"{nation.title()}",
                value=f"**ID:** #{alliance_id}\n**Formed by:** {user.mention if user else 'Unknown'}\n**Since:** {created_at}",
                inline=True
            )
            
        await interaction.response.send_message(embed=embed)
        
    @app_commands.command(name="trades", description="View all active trade agreements")
    async def view_trades(self, interaction: discord.Interaction):
        """View trade agreements"""
        trades = await self.db.get_trades()
        
        if not trades:
            await interaction.response.send_message("No active trade agreements.", ephemeral=True)
            return
            
        embed = discord.Embed(
            title="?? Active Trade Agreements",
            color=discord.Color.gold()
        )
        
        for trade in trades:
            trade_id, nation, resource, amount, created_by, created_at, status = trade
            user = self.bot.get_user(created_by)
            embed.add_field(
                name=f"Trade #{trade_id} - {nation.title()}",
                value=f"**Resource:** {resource.title()}\n**Amount:** {amount}\n**Negotiated by:** {user.mention if user else 'Unknown'}",
                inline=False
            )
            
        await interaction.response.send_message(embed=embed)

async def setup(bot):
    await bot.add_cog(Diplomacy(bot))
