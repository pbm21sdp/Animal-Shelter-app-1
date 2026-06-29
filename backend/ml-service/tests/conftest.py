"""
Shared pytest configuration for ml-service unit tests.

Strategy for CLIP isolation
─────────────────────────────────────────────────────────────────────────────
app.py tries to import torch + transformers at module level (lines 13-18).

We mock ONLY transformers (not torch).  Reason:
  • scipy._lib.array_api_compat checks `issubclass(cls, torch.Tensor)`.
    If sys.modules['torch'] is a MagicMock, torch.Tensor is also a MagicMock,
    and issubclass() raises TypeError.  Leaving real torch in place (or absent)
    avoids this completely.
  • We only need to block weight loading, which happens inside CLIPModel /
    CLIPProcessor.  Replacing sys.modules['transformers'] with a MagicMock is
    sufficient: every `from transformers import CLIPModel` inside load_clip()
    returns our mock, so no file I/O or GPU memory allocation occurs.

CLIP_AVAILABLE ends up True (if torch is installed) or False (if absent).
Either way our tests work correctly because we never call the image-analysis
endpoint and load_clip() always gets the mocked classes.
"""

import sys
from unittest.mock import MagicMock
import pytest

# ── Replace transformers before app.py is imported ───────────────────────────

_mock_clip_model = MagicMock(name="clip_model_instance")
_mock_clip_processor = MagicMock(name="clip_processor_instance")

_mock_transformers = MagicMock(name="transformers_mock")
_mock_transformers.CLIPModel.from_pretrained.return_value = _mock_clip_model
_mock_transformers.CLIPProcessor.from_pretrained.return_value = _mock_clip_processor

sys.modules["transformers"] = _mock_transformers


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_clip_state():
    """Reset CLIP lazy-load globals and mock call histories before every test."""
    import app
    app.clip_model = None
    app.clip_processor = None

    # reset_mock() clears call counts / call_args on all child mocks.
    # Re-set return values explicitly to survive recursive reset.
    _mock_transformers.reset_mock(return_value=True)
    _mock_transformers.CLIPModel.from_pretrained.return_value = _mock_clip_model
    _mock_transformers.CLIPProcessor.from_pretrained.return_value = _mock_clip_processor

    yield

    app.clip_model = None
    app.clip_processor = None


@pytest.fixture
def predictor():
    """Fresh AdoptionPredictor for each test."""
    from app import AdoptionPredictor
    return AdoptionPredictor()


@pytest.fixture
def mock_transformers():
    """Expose the injected transformers mock for inspection in tests."""
    return _mock_transformers


@pytest.fixture
def flask_client():
    """Flask test client — no running server required."""
    import app as ml_app
    ml_app.app.config["TESTING"] = True
    with ml_app.app.test_client() as client:
        yield client
