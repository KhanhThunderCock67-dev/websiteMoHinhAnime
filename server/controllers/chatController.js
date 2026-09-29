const { processChatMessage } = require('../services/aiService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Chatbot assistant consultation endpoint with context retrieval & streaming
 * @route   POST /api/chat
 * @access  Public
 */
const handleChat = asyncHandler(async (req, res) => {
  const { messages, stream = false } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, 'Tin nhắn không hợp lệ (cần danh sách messages có role và content)');
  }

  // Validate message structures
  for (const m of messages) {
    if (!m.role || !m.content || typeof m.content !== 'string') {
      throw new ApiError(400, 'Cấu trúc tin nhắn không hợp lệ');
    }
  }

  // Optional: check if client accepts SSE via Accept header or stream param
  const wantsStream = stream === true || req.headers.accept === 'text/event-stream';

  try {
    const chatResult = await processChatMessage({
      messages,
      stream: wantsStream,
    });

    // If streaming response is available and client wants stream
    if (chatResult.stream && chatResult.response && typeof chatResult.response[Symbol.asyncIterator] === 'function') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      // Send initial metadata event with matched products
      res.write(`event: meta\ndata: ${JSON.stringify({ matchedProducts: chatResult.matchedProducts, source: chatResult.source })}\n\n`);

      const textDecoder = new TextDecoder();
      for await (const chunk of chatResult.response) {
        const text = typeof chunk === 'string' ? chunk : textDecoder.decode(chunk);
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Standard JSON response
    res.json({
      success: true,
      data: {
        reply: chatResult.response,
        source: chatResult.source,
        matchedProducts: chatResult.matchedProducts,
      },
    });
  } catch (error) {
    console.error('[Chat Controller Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xử lý phản hồi từ AI Assistant',
    });
  }
});

module.exports = {
  handleChat,
};
