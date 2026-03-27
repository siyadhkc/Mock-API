import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from workspaces.models import WorkspaceMember


class LogConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.workspace_id = self.scope['url_route']['kwargs']['workspace_id']
        self.group_name = f'logs_{self.workspace_id}'

        # Auth check
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close(code=4001)
            return

        is_member = await self._check_membership(user)
        if not is_member:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def log_message(self, event):
        await self.send(text_data=json.dumps(event['data']))

    @database_sync_to_async
    def _check_membership(self, user):
        return WorkspaceMember.objects.filter(
            workspace_id=self.workspace_id, user=user
        ).exists()
