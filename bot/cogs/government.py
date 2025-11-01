import discord
from discord.ext import commands
from discord import app_commands
import config
from datetime import datetime, timedelta

class Government(commands.Cog):
    """Government and Law Management Commands"""
    
    def __init__(self, bot):
        self.bot = bot
        self.db = bot.db
        self.roblox = bot.roblox
        
    def has_government_role(self):
        """Check if user has government permissions"""
        async def predicate(interaction: discord.Interaction):
            user_roles = [role.id for role in interaction.user.roles]
            return (config.PRESIDENT_ROLE_ID in user_roles or 
                    config.MINISTER_ROLE_ID in user_roles or 
                    config.COUNCIL_MEMBER_ROLE_ID in user_roles)
        return app_commands.check(predicate)
        
    @app_commands.command(name="propose", description="Propose a new law")
    @app_commands.describe(
        title="Title of the law",
        description="Detailed description of what the law does"
    )
    async def propose_law(self, interaction: discord.Interaction, title: str, description: str):
        """Propose a new law for voting"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID, config.COUNCIL_MEMBER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? You need government clearance to propose laws!", ephemeral=True)
            return
            
        # Create law in database
        law_id = await self.db.create_law(title, description, interaction.user.id)
        
        # Create voting embed
        embed = discord.Embed(
            title=f"?? New Law Proposal #{law_id}",
            description=f"**{title}**\n\n{description}",
            color=discord.Color.blue(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Proposed by", value=interaction.user.mention, inline=False)
        embed.add_field(name="Status", value="??? Voting in Progress", inline=False)
        embed.add_field(name="Votes For", value="0", inline=True)
        embed.add_field(name="Votes Against", value="0", inline=True)
        embed.set_footer(text=f"Law ID: {law_id} | Use /vote {law_id} to cast your vote")
        
        # Send to voting channel
        channel = self.bot.get_channel(config.VOTING_CHANNEL_ID)
        if channel:
            message = await channel.send(embed=embed)
            await message.add_reaction("?")  # For
            await message.add_reaction("?")  # Against
            
        await interaction.response.send_message(f"? Law proposal #{law_id} has been submitted for voting!", ephemeral=True)
        
    @app_commands.command(name="vote", description="Vote on a proposed law")
    @app_commands.describe(
        law_id="ID of the law to vote on",
        vote="Your vote (for or against)"
    )
    @app_commands.choices(vote=[
        app_commands.Choice(name="For", value="for"),
        app_commands.Choice(name="Against", value="against")
    ])
    async def vote_law(self, interaction: discord.Interaction, law_id: int, vote: str):
        """Vote on a law proposal"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID, config.COUNCIL_MEMBER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? You need government clearance to vote!", ephemeral=True)
            return
            
        # Get law details
        law = await self.db.get_law(law_id)
        if not law:
            await interaction.response.send_message(f"? Law #{law_id} not found!", ephemeral=True)
            return
            
        if law[4] != 'pending':  # status field
            await interaction.response.send_message(f"? Law #{law_id} is no longer open for voting!", ephemeral=True)
            return
            
        # Record vote
        success = await self.db.vote_on_law(law_id, interaction.user.id, vote)
        
        if success:
            vote_emoji = "?" if vote == "for" else "?"
            await interaction.response.send_message(
                f"{vote_emoji} Your vote has been recorded for Law #{law_id}!",
                ephemeral=True
            )
            
            # Update voting message if possible
            channel = self.bot.get_channel(config.VOTING_CHANNEL_ID)
            if channel:
                # Fetch updated law data
                updated_law = await self.db.get_law(law_id)
                embed = discord.Embed(
                    title=f"?? Law Proposal #{law_id}",
                    description=f"**{updated_law[1]}**\n\n{updated_law[2]}",
                    color=discord.Color.blue(),
                    timestamp=datetime.now()
                )
                embed.add_field(name="Status", value="??? Voting in Progress", inline=False)
                embed.add_field(name="Votes For", value=str(updated_law[5]), inline=True)
                embed.add_field(name="Votes Against", value=str(updated_law[6]), inline=True)
                embed.set_footer(text=f"Law ID: {law_id}")
        else:
            await interaction.response.send_message(
                "? You have already voted on this law!",
                ephemeral=True
            )
            
    @app_commands.command(name="enact", description="Enact a law that passed voting")
    @app_commands.describe(law_id="ID of the law to enact")
    async def enact_law(self, interaction: discord.Interaction, law_id: int):
        """Enact a law (President/Ministers only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can enact laws!", ephemeral=True)
            return
            
        # Get law details
        law = await self.db.get_law(law_id)
        if not law:
            await interaction.response.send_message(f"? Law #{law_id} not found!", ephemeral=True)
            return
            
        if law[4] == 'enacted':
            await interaction.response.send_message(f"? Law #{law_id} has already been enacted!", ephemeral=True)
            return
            
        votes_for = law[5]
        votes_against = law[6]
        total_votes = votes_for + votes_against
        
        if total_votes == 0:
            await interaction.response.send_message("? No votes have been cast on this law yet!", ephemeral=True)
            return
            
        approval_rate = votes_for / total_votes
        
        if approval_rate < config.VOTE_THRESHOLD:
            await interaction.response.send_message(
                f"? Law #{law_id} did not reach the required {config.VOTE_THRESHOLD*100}% approval threshold! ({approval_rate*100:.1f}% approved)",
                ephemeral=True
            )
            return
            
        # Enact the law
        await self.db.enact_law(law_id)
        
        # Send to Roblox
        success, message = await self.roblox.enact_law(law[1], law[2])
        
        # Announce
        embed = discord.Embed(
            title="?? LAW ENACTED",
            description=f"**{law[1]}**\n\n{law[2]}",
            color=discord.Color.green(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Enacted by", value=interaction.user.mention, inline=True)
        embed.add_field(name="Votes", value=f"? {votes_for} | ? {votes_against}", inline=True)
        embed.add_field(name="Approval Rate", value=f"{approval_rate*100:.1f}%", inline=True)
        embed.add_field(name="Roblox Status", value="? Applied" if success else "?? Pending", inline=False)
        
        channel = self.bot.get_channel(config.ANNOUNCEMENTS_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? Law #{law_id} has been enacted!", ephemeral=True)
        
    @app_commands.command(name="laws", description="View all pending or enacted laws")
    @app_commands.describe(status="Filter by status")
    @app_commands.choices(status=[
        app_commands.Choice(name="Pending", value="pending"),
        app_commands.Choice(name="Enacted", value="enacted")
    ])
    async def view_laws(self, interaction: discord.Interaction, status: str = "pending"):
        """View laws"""
        laws = await self.db.get_pending_laws() if status == "pending" else []
        
        if not laws:
            await interaction.response.send_message(f"No {status} laws found.", ephemeral=True)
            return
            
        embed = discord.Embed(
            title=f"?? {status.title()} Laws",
            color=discord.Color.blue()
        )
        
        for law in laws[:10]:  # Limit to 10 laws
            law_id, title, description, proposed_by, proposed_at, status, votes_for, votes_against, enacted_at = law
            embed.add_field(
                name=f"#{law_id}: {title}",
                value=f"{description[:100]}...\n? {votes_for} | ? {votes_against}",
                inline=False
            )
            
        await interaction.response.send_message(embed=embed)
        
    @app_commands.command(name="borders", description="Control national borders")
    @app_commands.describe(
        action="Open or close borders",
        border_type="Type of border control"
    )
    @app_commands.choices(
        action=[
            app_commands.Choice(name="Open", value="open"),
            app_commands.Choice(name="Close", value="close")
        ],
        border_type=[
            app_commands.Choice(name="All", value="all"),
            app_commands.Choice(name="Trade", value="trade"),
            app_commands.Choice(name="Military", value="military"),
            app_commands.Choice(name="Immigration", value="immigration")
        ]
    )
    async def border_control(self, interaction: discord.Interaction, action: str, border_type: str = "all"):
        """Control borders (President/Ministers only)"""
        if not any(role.id in [config.PRESIDENT_ROLE_ID, config.MINISTER_ROLE_ID] 
                   for role in interaction.user.roles):
            await interaction.response.send_message("? Only the President or Ministers can control borders!", ephemeral=True)
            return
            
        # Send to Roblox
        success, message = await self.roblox.border_control(action, border_type)
        
        embed = discord.Embed(
            title=f"?? Border Control: {action.upper()}",
            description=f"Borders have been **{action}ed** for **{border_type}**.",
            color=discord.Color.orange(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Ordered by", value=interaction.user.mention)
        embed.add_field(name="Roblox Status", value="? Applied" if success else "?? Failed")
        
        channel = self.bot.get_channel(config.ANNOUNCEMENTS_CHANNEL_ID)
        if channel:
            await channel.send(embed=embed)
            
        await interaction.response.send_message(f"? Borders {action}ed for {border_type}!", ephemeral=True)

async def setup(bot):
    await bot.add_cog(Government(bot))
