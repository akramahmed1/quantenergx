# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from app.core.security import get_current_user, check_permissions
from app.services.extensibility_service import ExtensibilityService

router = APIRouter()
extensibility_service = ExtensibilityService()


@router.get("/plugins")
async def get_available_plugins(
    current_user: dict = Depends(get_current_user),
    category: str = Query(None, description="Filter by plugin category")
):
    """Get list of available plugins."""
    plugins = await extensibility_service.get_available_plugins(category)
    return {"plugins": plugins}


@router.get("/plugins/installed")
async def get_installed_plugins(
    current_user: dict = Depends(get_current_user)
):
    """Get user's installed plugins."""
    plugins = await extensibility_service.get_user_plugins(current_user["id"])
    return {"installed_plugins": plugins}


@router.post("/plugins/{plugin_id}/install")
async def install_plugin(
    plugin_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Install a plugin for the user."""
    # Check if plugin exists
    plugin = await extensibility_service.get_plugin_by_id(plugin_id)
    if not plugin:
        raise HTTPException(status_code=404, detail="Plugin not found")
    
    # Check if already installed
    if await extensibility_service.is_plugin_installed(current_user["id"], plugin_id):
        raise HTTPException(status_code=400, detail="Plugin already installed")
    
    success = await extensibility_service.install_plugin(current_user["id"], plugin_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to install plugin")
    
    return {"message": "Plugin installed successfully"}


@router.delete("/plugins/{plugin_id}")
async def uninstall_plugin(
    plugin_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Uninstall a plugin."""
    success = await extensibility_service.uninstall_plugin(current_user["id"], plugin_id)
    if not success:
        raise HTTPException(status_code=404, detail="Plugin not found or not installed")
    
    return {"message": "Plugin uninstalled successfully"}


@router.get("/plugins/{plugin_id}/config")
async def get_plugin_config(
    plugin_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get plugin configuration."""
    if not await extensibility_service.is_plugin_installed(current_user["id"], plugin_id):
        raise HTTPException(status_code=404, detail="Plugin not installed")
    
    config = await extensibility_service.get_plugin_config(current_user["id"], plugin_id)
    return {"plugin_id": plugin_id, "config": config}


@router.put("/plugins/{plugin_id}/config")
async def update_plugin_config(
    plugin_id: str,
    config: Dict,
    current_user: dict = Depends(get_current_user)
):
    """Update plugin configuration."""
    if not await extensibility_service.is_plugin_installed(current_user["id"], plugin_id):
        raise HTTPException(status_code=404, detail="Plugin not installed")
    
    success = await extensibility_service.update_plugin_config(
        user_id=current_user["id"],
        plugin_id=plugin_id,
        config=config
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update plugin configuration")
    
    return {"message": "Plugin configuration updated successfully"}


@router.post("/webhooks")
async def create_webhook(
    webhook_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a webhook endpoint."""
    webhook = await extensibility_service.create_webhook(
        user_id=current_user["id"],
        webhook_data=webhook_data
    )
    return {"webhook_id": webhook["id"], "webhook_url": webhook["url"]}


@router.get("/webhooks")
async def get_user_webhooks(
    current_user: dict = Depends(get_current_user)
):
    """Get user's webhooks."""
    webhooks = await extensibility_service.get_user_webhooks(current_user["id"])
    return {"webhooks": webhooks}


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a webhook."""
    success = await extensibility_service.delete_webhook(current_user["id"], webhook_id)
    if not success:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    return {"message": "Webhook deleted successfully"}


@router.post("/api-keys")
async def create_api_key(
    api_key_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create an API key for external integrations."""
    api_key = await extensibility_service.create_api_key(
        user_id=current_user["id"],
        key_data=api_key_data
    )
    return {
        "api_key_id": api_key["id"],
        "api_key": api_key["key"],
        "message": "API key created successfully. Store it securely as it won't be shown again."
    }


@router.get("/api-keys")
async def get_user_api_keys(
    current_user: dict = Depends(get_current_user)
):
    """Get user's API keys (without the actual key values)."""
    api_keys = await extensibility_service.get_user_api_keys(current_user["id"])
    return {"api_keys": api_keys}


@router.delete("/api-keys/{api_key_id}")
async def revoke_api_key(
    api_key_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Revoke an API key."""
    success = await extensibility_service.revoke_api_key(current_user["id"], api_key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {"message": "API key revoked successfully"}


@router.post("/custom-endpoints")
async def create_custom_endpoint(
    endpoint_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a custom API endpoint (enterprise feature)."""
    if not check_permissions("enterprise")(current_user):
        raise HTTPException(status_code=403, detail="Enterprise access required")
    
    endpoint = await extensibility_service.create_custom_endpoint(
        user_id=current_user["id"],
        endpoint_data=endpoint_data
    )
    return {"endpoint_id": endpoint["id"], "endpoint_url": endpoint["url"]}


@router.get("/integrations")
async def get_available_integrations():
    """Get list of available third-party integrations."""
    integrations = await extensibility_service.get_available_integrations()
    return {"integrations": integrations}