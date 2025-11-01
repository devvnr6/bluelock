import aiohttp
import json
from datetime import datetime
import config

class RobloxIntegration:
    """
    Handles communication between Discord bot and Roblox game.
    
    SETUP INSTRUCTIONS FOR ROBLOX:
    1. In your Roblox game, create a ServerScriptService script
    2. Enable HttpService in game settings
    3. Create endpoints to receive commands from this bot
    4. Use the MessagingService or DataStoreService to communicate with game servers
    """
    
    def __init__(self):
        self.game_id = config.ROBLOX_GAME_ID
        self.api_key = config.ROBLOX_API_KEY
        self.base_url = f"https://apis.roblox.com/messaging-service/v1/universes/{self.game_id}/topics"
        
    async def send_to_roblox(self, topic, data):
        """
        Send data to Roblox game using MessagingService.
        
        Args:
            topic: The topic/channel to send to (e.g., 'government', 'military', 'economy')
            data: Dictionary containing the command and parameters
        """
        try:
            headers = {
                "x-api-key": self.api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "message": json.dumps(data)
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/{topic}",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        return True, "Successfully sent to Roblox"
                    else:
                        error_text = await response.text()
                        return False, f"Failed to send to Roblox: {error_text}"
        except Exception as e:
            return False, f"Error communicating with Roblox: {str(e)}"
            
    async def declare_war(self, target_nation, declared_by_name):
        """Send war declaration to Roblox"""
        data = {
            "action": "declare_war",
            "target": target_nation,
            "declared_by": declared_by_name,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("military", data)
        
    async def mobilize_troops(self, unit_type, amount, location):
        """Send troop mobilization command to Roblox"""
        data = {
            "action": "mobilize",
            "unit_type": unit_type,
            "amount": amount,
            "location": location,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("military", data)
        
    async def deploy_troops(self, unit_type, target_location):
        """Deploy troops to a location"""
        data = {
            "action": "deploy",
            "unit_type": unit_type,
            "location": target_location,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("military", data)
        
    async def set_defense_status(self, status):
        """Set national defense status"""
        data = {
            "action": "defense_status",
            "status": status,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("military", data)
        
    async def create_alliance(self, nation):
        """Create alliance in Roblox"""
        data = {
            "action": "alliance",
            "nation": nation,
            "status": "active",
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("diplomacy", data)
        
    async def break_alliance(self, nation):
        """Break alliance in Roblox"""
        data = {
            "action": "break_alliance",
            "nation": nation,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("diplomacy", data)
        
    async def establish_trade(self, nation, resource, amount):
        """Establish trade route in Roblox"""
        data = {
            "action": "trade",
            "nation": nation,
            "resource": resource,
            "amount": amount,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("economy", data)
        
    async def impose_sanction(self, nation):
        """Impose sanctions in Roblox"""
        data = {
            "action": "sanction",
            "nation": nation,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("diplomacy", data)
        
    async def set_tax_rate(self, rate):
        """Update tax rate in Roblox"""
        data = {
            "action": "tax_rate",
            "rate": rate,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("economy", data)
        
    async def control_resource(self, resource_type, amount):
        """Control resource production/allocation in Roblox"""
        data = {
            "action": "resource_control",
            "resource": resource_type,
            "amount": amount,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("economy", data)
        
    async def initiate_espionage(self, target_nation):
        """Start espionage mission in Roblox"""
        data = {
            "action": "espionage",
            "target": target_nation,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("espionage", data)
        
    async def enact_law(self, law_title, law_description):
        """Send enacted law to Roblox"""
        data = {
            "action": "enact_law",
            "title": law_title,
            "description": law_description,
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("government", data)
        
    async def border_control(self, action, border_type=None):
        """Control borders (open/close)"""
        data = {
            "action": "border_control",
            "border_action": action,  # 'open' or 'close'
            "type": border_type,  # 'trade', 'military', 'immigration', or 'all'
            "timestamp": str(datetime.now())
        }
        return await self.send_to_roblox("government", data)
