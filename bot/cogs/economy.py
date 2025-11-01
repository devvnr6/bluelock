import discord
from discord.ext import commands
from discord import app_commands
import config
from datetime import datetime

class Economy(commands.Cog):
    """Economy and Resource Management Commands"""
    
    def __init__(self, bot):
        self.bot = bot
        self.db = bot.db
        self.roblox = bot.roblox
        
    @app_commands.command(name="tax", description="Set national tax rate")
    @app_commands.describe(rate="Tax rate percentage (0-50)")
    async def set_tax(self, interaction: discord.Interaction, rate: int):
        """Set tax rate (President/Economy Minister only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can set tax rates!", ephemeral=True)
            return
            
        if rate < config.MIN_TAX_RATE or rate > config.MAX_TAX_RATE:
            await interaction.response.send_message(
                f"? Tax rate must be between {config.MIN_TAX_RATE}% and {config.MAX_TAX_RATE}%!",
                ephemeral=True
            )
            return
            
        # Update tax rate
        await self.db.set_tax_rate(rate)
        
        # Send to Roblox
        success, message = await self.roblox.set_tax_rate(rate)
        
        # Determine tax impact
        if rate < 15:
            impact = "?? Economic growth expected, lower government revenue"
            color = discord.Color.green()
        elif rate < 30:
            impact = "?? Balanced approach, moderate revenue"
            color = discord.Color.blue()
        else:
            impact = "?? High taxes may slow growth, increased revenue"
            color = discord.Color.orange()
            
        embed = discord.Embed(
            title="?? TAX RATE CHANGED",
            description=f"**National tax rate set to {rate}%**",
            color=color,
            timestamp=datetime.now()
        )
        embed.add_field(name="Set by", value=interaction.user.mention)
        embed.add_field(name="New Rate", value=f"{rate}%")
        embed.add_field(name="Economic Impact", value=impact, inline=False)
        embed.add_field(name="Status", value="? Applied" if success else "?? Pending")
        
        channel = self.bot.get_channel(config.ANNOUNCEMENTS_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? Tax rate set to {rate}%!", ephemeral=True)
        
    @app_commands.command(name="control", description="Control resource production/allocation")
    @app_commands.describe(
        resource="Type of resource",
        amount="Amount to allocate"
    )
    async def control_resource(self, interaction: discord.Interaction, resource: str, amount: int):
        """Control resources (President/Economy Minister only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can control resources!", ephemeral=True)
            return
            
        resource = resource.lower()
        if resource not in config.RESOURCES:
            await interaction.response.send_message(
                f"? Invalid resource! Valid resources: {', '.join(config.RESOURCES)}",
                ephemeral=True
            )
            return
            
        # Update resource
        await self.db.set_resource(resource, amount)
        
        # Send to Roblox
        success, message = await self.roblox.control_resource(resource, amount)
        
        # Resource emojis
        resource_emojis = {
            'oil': '???',
            'food': '??',
            'minerals': '??',
            'steel': '??',
            'coal': '??',
            'gold': '??'
        }
        
        embed = discord.Embed(
            title=f"{resource_emojis.get(resource, '??')} RESOURCE CONTROL",
            description=f"**{resource.title()} allocation set to {amount} units**",
            color=discord.Color.blue(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Managed by", value=interaction.user.mention)
        embed.add_field(name="Resource", value=resource.title())
        embed.add_field(name="Amount", value=str(amount))
        embed.add_field(name="Status", value="? Updated" if success else "?? Pending")
        
        channel = self.bot.get_channel(config.GOVERNMENT_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? {resource.title()} set to {amount} units!", ephemeral=True)
        
    @app_commands.command(name="budget", description="View national budget and economy status")
    async def view_budget(self, interaction: discord.Interaction):
        """View economy status"""
        economy = await self.db.get_economy()
        resources = await self.db.get_resources()
        
        embed = discord.Embed(
            title="?? NATIONAL ECONOMY STATUS",
            color=discord.Color.gold(),
            timestamp=datetime.now()
        )
        
        # Economy data
        if economy:
            tax_rate = economy[1] if len(economy) > 1 else config.DEFAULT_TAX_RATE
            budget = economy[2] if len(economy) > 2 else 0
            
            embed.add_field(name="Tax Rate", value=f"{tax_rate}%", inline=True)
            embed.add_field(name="National Budget", value=f"${budget:,}", inline=True)
            embed.add_field(name="Last Updated", value=economy[3] if len(economy) > 3 else "N/A", inline=True)
            
        # Resources
        if resources:
            resource_text = ""
            resource_emojis = {
                'oil': '???',
                'food': '??',
                'minerals': '??',
                'steel': '??',
                'coal': '??',
                'gold': '??'
            }
            
            for resource in resources:
                resource_type = resource[1]
                amount = resource[2]
                emoji = resource_emojis.get(resource_type, '??')
                resource_text += f"{emoji} **{resource_type.title()}:** {amount:,} units\n"
                
            if resource_text:
                embed.add_field(name="National Resources", value=resource_text, inline=False)
        else:
            embed.add_field(name="National Resources", value="No resource data available", inline=False)
            
        # Trade agreements
        trades = await self.db.get_trades()
        if trades:
            embed.add_field(name="Active Trades", value=str(len(trades)), inline=True)
            
        # Sanctions
        sanctions = await self.db.get_sanctions()
        if sanctions:
            sanctioned_nations = [s[1].title() for s in sanctions]
            embed.add_field(name="Sanctioned Nations", value=", ".join(sanctioned_nations), inline=False)
            
        await interaction.response.send_message(embed=embed)
        
    @app_commands.command(name="resources", description="View all national resources")
    async def view_resources(self, interaction: discord.Interaction):
        """View detailed resource breakdown"""
        resources = await self.db.get_resources()
        
        embed = discord.Embed(
            title="?? NATIONAL RESOURCES",
            description="Detailed breakdown of all available resources",
            color=discord.Color.green(),
            timestamp=datetime.now()
        )
        
        resource_emojis = {
            'oil': '???',
            'food': '??',
            'minerals': '??',
            'steel': '??',
            'coal': '??',
            'gold': '??'
        }
        
        if resources:
            for resource in resources:
                resource_type = resource[1]
                amount = resource[2]
                updated = resource[3]
                emoji = resource_emojis.get(resource_type, '??')
                
                embed.add_field(
                    name=f"{emoji} {resource_type.title()}",
                    value=f"**Amount:** {amount:,} units\n**Updated:** {updated}",
                    inline=True
                )
        else:
            embed.description = "No resources tracked yet. Use `/control` to allocate resources."
            
        await interaction.response.send_message(embed=embed)
        
    @app_commands.command(name="economyreport", description="Generate comprehensive economy report")
    async def economy_report(self, interaction: discord.Interaction):
        """Generate full economic report (Government only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID, config.COUNCIL_MEMBER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? You need government clearance to view this report!", ephemeral=True)
            return
            
        economy = await self.db.get_economy()
        resources = await self.db.get_resources()
        trades = await self.db.get_trades()
        sanctions = await self.db.get_sanctions()
        
        embed = discord.Embed(
            title="?? COMPREHENSIVE ECONOMY REPORT",
            color=discord.Color.dark_gold(),
            timestamp=datetime.now()
        )
        
        # General Economy
        if economy:
            tax_rate = economy[1] if len(economy) > 1 else config.DEFAULT_TAX_RATE
            budget = economy[2] if len(economy) > 2 else 0
            
            embed.add_field(
                name="?? Financial Status",
                value=f"**Tax Rate:** {tax_rate}%\n**Budget:** ${budget:,}\n**Revenue:** ${int(budget * tax_rate / 100):,}/cycle",
                inline=False
            )
            
        # Resources Summary
        total_resource_value = 0
        if resources:
            for resource in resources:
                total_resource_value += resource[2]  # amount
                
            embed.add_field(
                name="?? Resources",
                value=f"**Total Units:** {total_resource_value:,}\n**Resource Types:** {len(resources)}",
                inline=True
            )
            
        # Trade Summary
        if trades:
            trade_value = sum(t[3] for t in trades if len(t) > 3)  # amount
            embed.add_field(
                name="?? Trade",
                value=f"**Active Agreements:** {len(trades)}\n**Trade Volume:** {trade_value:,} units",
                inline=True
            )
            
        # Sanctions Impact
        if sanctions:
            embed.add_field(
                name="?? Sanctions",
                value=f"**Nations Sanctioned:** {len(sanctions)}\n**Economic Impact:** -15% trade capacity",
                inline=True
            )
            
        embed.set_footer(text="Report generated for government officials only")
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot):
    await bot.add_cog(Economy(bot))
