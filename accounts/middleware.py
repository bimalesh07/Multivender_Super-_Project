from django.http import JsonResponse
from .jwt import decode_jwt
from .models import User

class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        # Allow admin panel to work 
        if request.path.startswith("/admin"):
            return self.get_response(request)

        request.auth_user = None
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_jwt(token)

            if payload:
                try:
                    user = User.objects.get(id=payload["user_id"])
                    request.auth_user = user
                except User.DoesNotExist:
                    pass

        return self.get_response(request)
