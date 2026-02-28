from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class APIErrorMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if request.path.startswith('/api/'):
            content_type = response.get('Content-Type', '')
            if 'text/html' in content_type.lower():
                if response.status_code == 404:
                    return JsonResponse({"error": "API endpoint not found"}, status=404)
                if response.status_code == 500:
                    return JsonResponse({"error": "Internal server error"}, status=500)
                if response.status_code == 403:
                    return JsonResponse({"error": "Forbidden"}, status=403)
                if response.status_code == 400:
                    return JsonResponse({"error": "Bad request"}, status=400)
        return response
