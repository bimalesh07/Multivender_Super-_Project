from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def api_404_handler(request, exception=None):
    return JsonResponse({"error": "API endpoint not found"}, status=404)

def api_500_handler(request):
    return JsonResponse({"error": "Internal server error"}, status=500)
