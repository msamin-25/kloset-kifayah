"""
Kloset Kifayah Backend - Upload Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import List
from uuid import UUID, uuid4

from app.core.supabase import get_supabase_admin, get_storage_url
from app.api.deps import get_current_user_id


router = APIRouter(prefix="/uploads", tags=["Uploads"])


ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_file(file: UploadFile) -> None:
    """Validate uploaded file."""
    # Check extension
    if file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
    
    # Check content type
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Upload an image to Supabase Storage.
    Returns the public URL of the uploaded image.
    """
    validate_file(file)
    
    admin = get_supabase_admin()
    
    # Generate unique filename
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "jpg"
    filename = f"{current_user_id}/{uuid4()}.{ext}"
    
    try:
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // 1024 // 1024}MB"
            )
        
        # Upload to Supabase Storage
        # Note: Bucket "listings" should be created in Supabase dashboard
        response = admin.storage.from_("listings").upload(
            filename,
            content,
            {"content-type": file.content_type or "image/jpeg"}
        )
        
        # Get public URL
        public_url = get_storage_url("listings", filename)
        
        return {
            "url": public_url,
            "filename": filename
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.post("/images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Upload multiple images at once.
    Returns list of public URLs.
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images allowed per upload"
        )
    
    results = []
    errors = []
    
    for i, file in enumerate(files):
        try:
            validate_file(file)
            
            admin = get_supabase_admin()
            
            ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "jpg"
            filename = f"{current_user_id}/{uuid4()}.{ext}"
            
            content = await file.read()
            
            if len(content) > MAX_FILE_SIZE:
                errors.append({
                    "index": i,
                    "filename": file.filename,
                    "error": "File too large"
                })
                continue
            
            admin.storage.from_("listings").upload(
                filename,
                content,
                {"content-type": file.content_type or "image/jpeg"}
            )
            
            public_url = get_storage_url("listings", filename)
            
            results.append({
                "index": i,
                "url": public_url,
                "filename": filename
            })
            
        except HTTPException as e:
            errors.append({
                "index": i,
                "filename": file.filename,
                "error": e.detail
            })
        except Exception as e:
            errors.append({
                "index": i,
                "filename": file.filename,
                "error": str(e)
            })
    
    return {
        "uploaded": results,
        "errors": errors
    }


@router.delete("/image/{filename:path}")
async def delete_image(
    filename: str,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Delete an uploaded image.
    Users can only delete their own images.
    """
    # Verify ownership (filename starts with user ID)
    if not filename.startswith(str(current_user_id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own images"
        )
    
    admin = get_supabase_admin()
    
    try:
        admin.storage.from_("listings").remove([filename])
        return {"message": "Image deleted"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete image: {str(e)}"
        )
