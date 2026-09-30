from django.http import FileResponse, Http404
from pathlib import Path
from django.conf import settings


def frontend_page(request, filename):
    file_path = Path(settings.BASE_DIR) / "frontend" / filename

    if not file_path.exists():
        raise Http404("Page not found")

    return FileResponse(
        open(file_path, "rb"),
        content_type="text/html"
    )