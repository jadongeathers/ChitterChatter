# app/services/image_service.py

import os
import openai
import base64
import time
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from flask import current_app
from app.models import db, PracticeCase, PracticeCaseImage
from app.utils.user_roles import can_user_modify_case

# Initialize OpenAI client
client = openai.OpenAI()

class ImageGenerationError(Exception):
    """Custom exception for image generation failures."""
    pass

class ImageService:
    @staticmethod
    def _get_s3_client():
        """Get S3 client with credentials from environment variables."""
        try:
            return boto3.client(
                's3',
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                region_name=os.getenv('AWS_REGION', 'us-east-1')
            )
        except NoCredentialsError:
            current_app.logger.error("AWS credentials not found. Please check environment variables.")
            raise ImageGenerationError("Cloud storage credentials not configured")

    @staticmethod
    def _construct_scene_prompt(case: PracticeCase) -> str:
        """
        Constructs a detailed prompt for generating realistic, immersive scenario environments.
        """
        situation = case.situation_instructions or ""
        cultural_context = case.cultural_context or ""
        language = case.target_language or ""
        
        # Base prompt structure
        base_prompt = f"""
        Create a highly realistic, photographic-quality image that immerses language learning students 
        in an authentic {language}-speaking environment. This image should make students feel like they are 
        actually present in the real-world scenario presented below: 
        
        SCENARIO:
        {situation}
        """
        
        # Add cultural context if available
        cultural_elements = ""
        if cultural_context.strip():
            cultural_elements = f"""
            
            CULTURAL CONTEXT: The environment should authentically reflect this cultural background: 
            {cultural_context}
            
            Ensure all visual elements (architecture, decor, lighting, atmosphere) are 
            culturally accurate and appropriate for a {language}-speaking region.
            """
        
        # Language-specific visual guidance
        language_guidance = f"""
        
        LANGUAGE & REGIONAL AUTHENTICITY: 
        - Design the environment to reflect authentic {language}-speaking cultural aesthetics
        - Include appropriate architectural styles, color schemes, and design elements
        - Ensure lighting, materials, and spatial arrangements match regional preferences
        - Incorporate subtle cultural markers that feel natural and unforced
        """
        
        # Technical specifications
        technical_specs = """
        
        VISUAL SPECIFICATIONS:
        - Style: Professional photography with realistic lighting and immersive perspective
        - Focus entirely on the realistic environment and setting where students will imagine themselves
        - Capture authentic atmosphere, proper lighting, and believable spatial details
        - Show the physical environment where this interaction would naturally occur
        
        RESTRICTIONS:
        - Do not include any people, faces, or human figures in the foreground (they may be present in the background)
        - Do not include any text, characters, words, letters, or signs with readable text
        - Avoid any obvious staging or artificial elements
        - Focus on environmental immersion rather than decorative elements
        """
        
        return (base_prompt + cultural_elements + language_guidance + technical_specs).strip()

    @staticmethod
    def _construct_character_prompt(case: PracticeCase) -> str:
        """
        Constructs a detailed prompt for generating realistic character portraits with cultural authenticity.
        """
        situation = case.situation_instructions or ""
        behavioral_guidelines = case.behavioral_guidelines or ""
        cultural_context = case.cultural_context or ""
        language = case.target_language or ""
        
        # Base character prompt
        base_prompt = f"""
        Create a highly realistic, photographic-quality portrait of a person who authentically
        embodies this character according to the character personality guidelines given below:

        CHARACTER GUIDELINES:
        {behavioral_guidelines}
        
        The person should be positioned in this setting given below: 
        
        SCENARIO CONTEXT:
        {situation}
        """
        
        # Cultural authenticity guidance
        cultural_guidance = ""
        if cultural_context.strip():
            cultural_guidance = f"""
            
            CULTURAL AUTHENTICITY: The character should reflect this cultural background: 
            {cultural_context}
            
            Ensure the person's appearance, clothing style, and overall presentation are 
            culturally appropriate and authentic for someone in a {language}-speaking context.
            """
        
        # Character appearance and positioning
        character_specs = f"""
        
        CHARACTER PRESENTATION:
        - Choose appearance details (age, gender, ethnicity, clothing style) that would be 
          realistic and appropriate for someone in this role within a {language}-speaking culture
        - Show authentic cultural styling in clothing, accessories, and grooming
        - Display appropriate facial expression and body language that reflects their character traits
        - Position the person facing directly toward the camera to create natural conversation feeling
        
        COMPOSITION & FRAMING:
        - IMPORTANT: Frame from at least waist-up or three-quarter length for natural conversation distance
        - Position at comfortable social distance - close enough for conversation, not intimate
        - Use professional portrait photography techniques with realistic lighting
        - Focus on the person as a conversation partner with background setting visible but secondary
        """
        
        # Technical and restriction specifications
        technical_specs = """
        
        VISUAL QUALITY:
        - Style: Professional portrait photography with natural, welcoming expression
        - Lighting: Realistic, flattering lighting that matches the environment
        - Expression: Natural and appropriate for their role and personality
        - Quality: High detail, photographic realism
        
        RESTRICTIONS:
        - Do not include any text, words, letters, or signs with readable text in the image
        - Avoid stereotypical or exaggerated cultural representations
        - Ensure respectful and authentic cultural portrayal
        - Focus on natural, professional presentation
        """
        
        return (base_prompt + cultural_guidance + character_specs + technical_specs).strip()

    @staticmethod
    def _construct_prompt(case: PracticeCase, include_person: bool = False) -> str:
        """
        Main prompt construction method that routes to appropriate specialized prompt builders.
        """
        # Validate required fields
        if not case.situation_instructions or not case.behavioral_guidelines or not case.target_language:
            raise ValueError("Situation instructions, behavioral guidelines, and target language are required.")
        
        if include_person:
            return ImageService._construct_character_prompt(case)
        else:
            return ImageService._construct_scene_prompt(case)

    @classmethod
    def _upload_to_s3(cls, image_data: bytes, case_id: int) -> str:
        """Upload image to S3 and return public URL."""
        try:
            s3_client = cls._get_s3_client()
            bucket_name = os.getenv('AWS_S3_BUCKET_NAME')
            
            if not bucket_name:
                raise ValueError("AWS_S3_BUCKET_NAME environment variable not set")
            
            # Create unique filename
            timestamp = int(time.time())
            filename = f"practice-cases/case_{case_id}_{timestamp}.png"
            
            current_app.logger.info(f"Uploading image to S3: {bucket_name}/{filename}")
            
            # Upload to S3 (removed ACL since bucket doesn't support it)
            s3_client.put_object(
                Bucket=bucket_name,
                Key=filename,
                Body=image_data,
                ContentType='image/png',
                CacheControl='max-age=31536000'  # Cache for 1 year
            )
            
            # Generate public URL with correct region
            region = os.getenv('AWS_REGION', 'us-east-2')  # Default to us-east-2
            public_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{filename}"
            
            current_app.logger.info(f"Successfully uploaded image to S3: {public_url}")
            return public_url
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            current_app.logger.error(f"Failed to upload to S3 (Error: {error_code}): {e}")
            
            if error_code == 'AccessDenied':
                raise ImageGenerationError("Access denied to cloud storage. Please check permissions.")
            elif error_code == 'NoSuchBucket':
                raise ImageGenerationError("Cloud storage bucket not found. Please check configuration.")
            else:
                raise ImageGenerationError("Failed to upload image to cloud storage") from e
        except Exception as e:
            current_app.logger.error(f"Unexpected error uploading to S3: {e}")
            raise ImageGenerationError("Failed to upload image to cloud storage") from e

    @classmethod
    def _delete_from_s3(cls, image_url: str) -> None:
        """Helper method to delete an image from S3."""
        try:
            s3_client = cls._get_s3_client()
            bucket_name = os.getenv('AWS_S3_BUCKET_NAME')
            
            # Extract key from URL
            if '.amazonaws.com/' in image_url:
                key = image_url.split('.amazonaws.com/')[-1]
                
                current_app.logger.info(f"Deleting S3 object: {bucket_name}/{key}")
                s3_client.delete_object(Bucket=bucket_name, Key=key)
                current_app.logger.info(f"Successfully deleted image from S3: {key}")
            else:
                current_app.logger.warning(f"Could not parse S3 key from URL: {image_url}")
                
        except Exception as e:
            current_app.logger.error(f"Failed to delete image from S3 {image_url}: {e}")
            # Don't raise exception - continue with the operation even if S3 deletion fails

    @classmethod
    def generate_and_save_image(cls, case: PracticeCase, include_person: bool = False) -> PracticeCaseImage:
        """Generate image using base64 response format and upload to S3. Replaces existing image if one exists."""
        prompt = cls._construct_prompt(case, include_person)
        
        try:
            current_app.logger.info(f"Generating {'character' if include_person else 'scene'} image for case {case.id} using base64 format")
            current_app.logger.debug(f"Generated prompt: {prompt[:200]}...")  # Log first 200 chars of prompt
            
            # Check if there's already an image for this case
            existing_image = PracticeCaseImage.query.filter_by(practice_case_id=case.id).first()
            if existing_image:
                current_app.logger.info(f"Found existing image {existing_image.id} for case {case.id}, will replace it")
            
            # Generate image with base64 response
            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                n=1,
                size="1024x1024",
                response_format="b64_json"
            )
            
            # Get base64 data and decode
            image_b64 = response.data[0].b64_json
            image_data = base64.b64decode(image_b64)
            current_app.logger.info("Successfully received base64 image data from OpenAI")
            
            # Upload new image to S3
            public_url = cls._upload_to_s3(image_data, case.id)

            if existing_image:
                # Delete old image from S3 before updating the record
                cls._delete_from_s3(existing_image.image_url)
                
                # Update existing record
                existing_image.image_url = public_url
                existing_image.prompt_text = prompt
                db.session.commit()
                
                current_app.logger.info(f"Successfully updated existing image record with ID: {existing_image.id}")
                return existing_image
            else:
                # Create new database record
                new_image = PracticeCaseImage(
                    practice_case_id=case.id,
                    image_url=public_url,
                    prompt_text=prompt
                )
                db.session.add(new_image)
                db.session.commit()
                
                current_app.logger.info(f"Successfully created new image record with ID: {new_image.id}")
                return new_image
            
        except openai.APIError as e:
            current_app.logger.error(f"OpenAI API error during image generation: {e}")
            error_message = "Unknown error"
            if hasattr(e, 'body') and e.body:
                error_message = e.body.get('message', 'Unknown error')
            raise ImageGenerationError(f"The image provider returned an error: {error_message}") from e
        except Exception as e:
            current_app.logger.error(f"An unexpected error occurred in image generation: {e}")
            db.session.rollback()
            raise ImageGenerationError("An unexpected error occurred while creating the image.") from e

    @classmethod
    def delete_image_and_file(cls, image_id: int, user) -> None:
        """Deletes an image from the database and S3."""
        image = PracticeCaseImage.query.get(image_id)

        if not image:
            raise FileNotFoundError("Image record not found.")

        if not can_user_modify_case(user, image.practice_case):
            raise PermissionError("User is not authorized to delete this image.")
        
        # Extract S3 key from URL
        image_url = image.image_url
        
        # Delete database record first
        db.session.delete(image)
        db.session.commit()
        
        # Delete from S3
        try:
            cls._delete_from_s3(image_url)
        except Exception as e:
            # Log error but don't fail the request since DB record is already gone
            current_app.logger.error(f"Failed to delete image from S3 during deletion: {e}")

    # Test method to verify S3 connection
    @classmethod
    def test_s3_connection(cls) -> dict:
        """Test S3 connection and permissions."""
        try:
            s3_client = cls._get_s3_client()
            bucket_name = os.getenv('AWS_S3_BUCKET_NAME')
            
            # Test bucket access
            response = s3_client.head_bucket(Bucket=bucket_name)
            
            # Test upload permissions with a small test file (removed ACL)
            test_key = "test/connection-test.txt"
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=b"Connection test"
            )
            
            # Clean up test file
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            
            return {
                "status": "success",
                "message": "S3 connection and permissions verified",
                "bucket": bucket_name
            }
            
        except Exception as e:
            return {
                "status": "error", 
                "message": str(e),
                "bucket": os.getenv('AWS_S3_BUCKET_NAME')
            }