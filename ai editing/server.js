const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// फोटो अपलोड करने के लिए सेटिंग
const upload = multer({ storage: multer.memoryStorage() });

// टेस्ट रूट (यह चेक करने के लिए कि सर्वर चल रहा है या नहीं)
app.get('/', (req, res) => {
    res.send('AI Editor Server Is Running Successfully!');
});

// फोटो एडिट करने का मुख्य रूट
app.post('/edit-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image' });
        }

        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'AI API Key is missing on the server' });
        }

        // Stability AI को भेजने के लिए डेटा तैयार करना
        const formData = new FormData();
        formData.append('image', req.file.buffer, { filename: req.file.originalname });
        formData.append('prompt', req.body.prompt || 'enhance quality, highly detailed');
        formData.append('search_prompt', req.body.search_prompt || 'background');
        formData.append('output_format', 'webp');

        // Stability AI API को कॉल करना
        const response = await axios.post(
            'https://api.stability.ai/v2beta/stable-image/edit/search-and-replace',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${apiKey}`,
                    Accept: 'image/*'
                },
                responseType: 'arraybuffer'
            }
        );

        // एडिट की हुई फोटो को वापस भेजना
        res.set('Content-Type', 'image/webp');
        res.send(response.data);

    } catch (error) {
        console.error('Error details:', error.response ? error.response.data.toString() : error.message);
        res.status(500).json({ error: 'AI processing failed' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});