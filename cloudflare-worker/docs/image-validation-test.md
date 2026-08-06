# Image Validation Test Specification

## Overview

Tests for the POST /api/validate-image endpoint using Workers AI face detection.

## Test Cases

### 1. 正脸单人 (Single Frontal Face)

| Field | Expected |
|---|---|
| faceCount | 1 |
| valid | true |
| code | - |
| message | - |

**Description:** A clear frontal portrait photo with one person's face. Workers AI should detect exactly 1 face and return valid: true.

---

### 2. 多人合影 (Group Photo)

| Field | Expected |
|---|---|
| faceCount | >1 |
| valid | false |
| code | MULTIPLE_FACES |
| message | "Multiple faces detected..." |

**Description:** A photo with two or more people. Workers AI should detect multiple faces and return MULTIPLE_FACES.

---

### 3. 风景 (Landscape/Scenery)

| Field | Expected |
|---|---|
| faceCount | 0 |
| valid | false |
| code | NO_FACE |
| message | "No face detected..." |

**Description:** A landscape or scenery photo with no human faces. Workers AI should detect 0 faces and return NO_FACE.

---

### 4. 宠物 (Pet)

| Field | Expected |
|---|---|
| faceCount | 0 |
| valid | false |
| code | NO_FACE |
| message | "No face detected..." |

**Description:** A photo of a pet (cat, dog, etc.). The mediapipe face-detection model only detects human faces, so pets should return NO_FACE.

---

### 5. 商品图片 (Product Image)

| Field | Expected |
|---|---|
| faceCount | 0 |
| valid | false |
| code | NO_FACE |
| message | "No face detected..." |

**Description:** A product photo without any human faces. Should return NO_FACE.

---

### 6. 模糊图片 (Blurred Image)

| Field | Expected |
|---|---|
| faceCount | 0 (or 1 with low confidence) |
| valid | false (or true) |
| code | NO_FACE (or -) |
| message | - |

**Description:** A severely blurred image where face detection may fail. The model's confidence threshold determines whether a blurred face is detected.

---

## AI Service Unavailable Test

When the AI binding is not configured in wrangler.toml:

| Field | Expected |
|---|---|
| faceCount | 0 |
| valid | false |
| code | AI_SERVICE_UNAVAILABLE |
| message | "Face detection is not configured..." |

**Test:** Run locally without AI binding in wrangler.toml. Should NOT return faceCount=1 or a false valid: true.

---

## Error Codes Reference

| Code | Meaning |
|---|---|
| NO_FACE | Image contains no human face |
| MULTIPLE_FACES | Image contains more than one face |
| INVALID_IMAGE | Image not found, uploadId missing, or detection failed |
| AI_SERVICE_UNAVAILABLE | Workers AI binding not configured |