const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * Intelligent MongoDB context retrieval based on customer query
 */
async function retrieveContext(userQuery = '') {
  try {
    const rawQuery = (userQuery || '').toLowerCase().trim();

    // 1. Fetch categories summary
    const categories = await Category.find().select('name slug description subCategories').lean();
    const categoriesContext = categories
      .map((c) => `- ${c.name} (${c.slug}): ${c.description || ''}`)
      .join('\n');

    // 2. Build smart search conditions
    const queryConditions = [];

    // Check for budget/price patterns (e.g. "dưới 100", "under 50", "< 80", "tầm 50")
    const priceMatch = rawQuery.match(/(?:dưới|under|tầm|<|<=)\s*(\d+(?:\.\d+)?)/i);
    let maxPriceFilter = null;
    if (priceMatch && priceMatch[1]) {
      const parsedPrice = parseFloat(priceMatch[1]);
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        maxPriceFilter = parsedPrice;
      }
    }

    // Check for sale or discount inquiry
    const isSaleQuery = /sale|giảm giá|khuyến mãi|discount|deal|giá tốt/i.test(rawQuery);

    // Check for pre-order inquiry
    const isPreOrderQuery = /pre-order|đặt trước|sắp ra mắt|preorder/i.test(rawQuery);

    // Check for best sellers or hot
    const isHotQuery = /bán chạy|best seller|hot|nổi bật|phổ biến|gợi ý/i.test(rawQuery);

    // Extract search terms (ignore generic Vietnamese/English stop words)
    const stopWords = new Set([
      'tôi', 'muốn', 'tìm', 'cho', 'hỏi', 'có', 'gì', 'nào', 'không', 'với', 'và', 'của', 'là',
      'i', 'want', 'looking', 'for', 'any', 'the', 'is', 'what', 'can', 'you', 'recommend', 'help',
      'shop', 'cửa', 'hàng', 'bạn', 'mình', 'ad', 'bot', 'sản', 'phẩm', 'tư', 'vấn'
    ]);

    const words = rawQuery
      .replace(/[^\w\s\u00C0-\u1EF9]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w));

    let products = [];

    // A. If words found, attempt text or regex matching
    if (words.length > 0) {
      const regexConditions = words.map((w) => ({
        $or: [
          { name: { $regex: w, $options: 'i' } },
          { brand: { $regex: w, $options: 'i' } },
          { subCategory: { $regex: w, $options: 'i' } },
          { 'attributes.character': { $regex: w, $options: 'i' } },
          { 'attributes.series': { $regex: w, $options: 'i' } },
          { 'attributes.faction': { $regex: w, $options: 'i' } },
          { description: { $regex: w, $options: 'i' } },
        ],
      }));

      const filter = { $and: regexConditions };
      if (maxPriceFilter) {
        filter.price = { $lte: maxPriceFilter };
      }
      if (isSaleQuery) {
        filter.discountPrice = { $gt: 0 };
      }
      if (isPreOrderQuery) {
        filter.isPreOrder = true;
      }

      products = await Product.find(filter)
        .populate('category', 'name slug')
        .limit(8)
        .lean();
    }

    // B. If no direct match or specific query type, fall back to thematic or popular products
    if (products.length === 0) {
      const fallbackFilter = {};
      if (maxPriceFilter) {
        fallbackFilter.price = { $lte: maxPriceFilter };
      }
      if (isSaleQuery) {
        fallbackFilter.discountPrice = { $gt: 0 };
      }
      if (isPreOrderQuery) {
        fallbackFilter.isPreOrder = true;
      }

      // Check category match
      if (/anime|figure|nendoroid|statue|mô hình/i.test(rawQuery)) {
        fallbackFilter.categorySlug = 'anime-figures';
      } else if (/warhammer|40k|space marine|chaos|imperium|miniature/i.test(rawQuery)) {
        fallbackFilter.categorySlug = 'warhammer-40k';
      } else if (/boardgame|board game|cờ bàn|thẻ bài|tabletop/i.test(rawQuery)) {
        fallbackFilter.categorySlug = 'board-games';
      }

      let sortCriteria = { soldCount: -1, rating: -1 };
      if (isHotQuery) {
        sortCriteria = { soldCount: -1 };
      }

      products = await Product.find(fallbackFilter)
        .populate('category', 'name slug')
        .sort(sortCriteria)
        .limit(6)
        .lean();
    }

    // Format products for System Context
    const productsContext = products.map((p) => {
      const inStock = p.stockCount > 0;
      const stockStatus = inStock ? `Còn ${p.stockCount} sản phẩm` : 'TẠM HẾT HÀNG (Hết hàng trong kho)';
      const finalPrice = p.discountPrice && p.discountPrice > 0 ? `$${p.discountPrice.toFixed(2)} (Đang giảm từ $${p.price.toFixed(2)})` : `$${p.price.toFixed(2)}`;

      const attrs = [];
      if (p.attributes?.series) attrs.push(`Series: ${p.attributes.series}`);
      if (p.attributes?.character) attrs.push(`Nhân vật: ${p.attributes.character}`);
      if (p.attributes?.scale) attrs.push(`Tỉ lệ: ${p.attributes.scale}`);
      if (p.attributes?.faction) attrs.push(`Phe phái: ${p.attributes.faction}`);
      if (p.attributes?.minPlayers && p.attributes?.maxPlayers) {
        attrs.push(`Số người chơi: ${p.attributes.minPlayers}-${p.attributes.maxPlayers} người`);
      }
      if (p.attributes?.complexity) attrs.push(`Độ khó: ${p.attributes.complexity}`);

      return [
        `• Tên: ${p.name}`,
        `  - Giá: ${finalPrice}`,
        `  - Trạng thái: ${stockStatus}`,
        `  - Danh mục: ${p.category?.name || p.categorySlug} (${p.subCategory}) | Thương hiệu: ${p.brand}`,
        attrs.length > 0 ? `  - Đặc điểm: ${attrs.join(' | ')}` : null,
        `  - Mô tả tóm tắt: ${p.description.substring(0, 160)}...`,
        `  - Link chi tiết: /product/${p.slug}`,
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    return {
      categoriesContext,
      productsContext,
      matchedProducts: products.map((p) => ({
        id: p._id,
        _id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.discountPrice || p.price,
        originalPrice: p.price,
        hasDiscount: p.discountPrice > 0,
        images: p.images,
        stockCount: p.stockCount,
        category: p.categorySlug,
      })),
    };
  } catch (error) {
    console.error('[AI Context Retrieval Error]:', error);
    return {
      categoriesContext: 'Anime Figures, Warhammer 40k, Board Games',
      productsContext: 'Không thể truy vấn danh sách sản phẩm thời gian thực.',
      matchedProducts: [],
    };
  }
}

/**
 * Build System Instruction with store persona and dynamic live database catalog
 */
function buildSystemPrompt(context) {
  return `Bạn là "HobbyBot" — Chuyên viên tư vấn bán hàng AI cao cấp, am hiểu sâu sắc và nhiệt huyết của cửa hàng "Hobby Vault" (nền tảng e-commerce chuyên về Anime Figures, Warhammer 40,000 & Tabletop Games, và Board Games quốc tế).

=== NHIỆM VỤ VÀ PHONG CÁCH TƯ VẤN ===
1. **Phong cách:** Lịch sự, chuyên nghiệp, súc tích, thân thiện và am tường sâu sắc về sở thích hobby (otaku figures, tabletop wargaming, board games).
2. **Nguyên tắc dữ liệu thực tế (CỰC KỲ QUAN TRỌNG):**
   - Chỉ tư vấn và giới thiệu các sản phẩm CÓ TRONG KHO HÀNG THỰC TẾ được cung cấp dưới đây. TUYỆT ĐỐI KHÔNG BỊA ĐẶT sản phẩm mà cửa hàng không có.
   - Nếu sản phẩm còn hàng trong kho: Nêu rõ tên sản phẩm, mức giá chính xác, điểm nổi bật và chèn link Markdown dẫn đến trang sản phẩm theo định dạng: [Xem chi tiết](/product/{slug}).
   - Nếu sản phẩm hết hàng hoặc không có: Thông báo nhã nhặn cho khách hàng biết, sau đó gợi ý sản phẩm thay thế tương đương đang có sẵn trong danh mục dưới đây.
3. **Định dạng phản hồi:**
   - Trả lời bằng Markdown rõ ràng, dễ nhìn.
   - In đậm tên sản phẩm (**Tên sản phẩm**) và giá tiền.
   - Dùng gạch đầu dòng ngắn gọn để liệt kê tính năng hoặc thông số (tỉ lệ figure, số người chơi, phe phái Warhammer,...).
   - Đính kèm liên kết xem chi tiết: [Xem sản phẩm](/product/slug-san-pham).
4. **Đơn vị tiền tệ:** Giá sản phẩm tính theo USD ($XX.XX) theo chuẩn hệ thống cửa hàng.

=== THÔNG TIN DANH MỤC CỬA HÀNG ===
${context.categoriesContext}

=== DANH SÁCH SẢN PHẨM KHẢ DỤNG TỪ DATABASE (LIVE CONTEXT) ===
${context.productsContext || 'Hiện chưa có sản phẩm cụ thể phù hợp.'}
`;
}

/**
 * Helper to determine whether apiKey is a standard AI Studio key or Bearer token (AQ. / ya29.)
 */
function getGeminiAuth(apiKey) {
  const isBearer = apiKey.startsWith('AQ.') || apiKey.startsWith('ya29.');
  return {
    headers: isBearer
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
      : { 'Content-Type': 'application/json' },
    queryParam: isBearer ? '' : `?key=${apiKey}`,
  };
}

/**
 * Discovers available models for this specific API key via ListModels
 */
async function discoverGeminiModels(apiKey) {
  if (cachedGeminiConfig) return cachedGeminiConfig;

  const { headers, queryParam } = getGeminiAuth(apiKey);
  const versions = ['v1beta', 'v1'];

  for (const v of versions) {
    try {
      const listUrl = `https://generativelanguage.googleapis.com/${v}/models${queryParam}`;
      const res = await fetch(listUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        const available = (data.models || [])
          .filter((m) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map((m) => m.name.replace(/^models\//, ''));

        if (available.length > 0) {
          console.log(`[Gemini Discovery] Found ${available.length} supported models on ${v}:`, available.slice(0, 8));
          cachedGeminiConfig = { apiVersion: v, availableModels: available };
          return cachedGeminiConfig;
        }
      }
    } catch (err) {
      // Continue to next version
    }
  }

  // Fallback defaults
  cachedGeminiConfig = {
    apiVersion: 'v1beta',
    availableModels: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro'],
  };
  return cachedGeminiConfig;
}

/**
 * Direct call to Google Gemini REST API with dynamic model discovery & automatic fallback
 */
async function callGeminiApi({ messages, systemInstruction, apiKey, model = 'gemini-1.5-flash', stream = false }) {
  const cleanPreferred = (model || '').replace(/^models\//, '').trim();

  // 1. Discover available models for this key
  const { apiVersion, availableModels } = await discoverGeminiModels(apiKey);

  // 2. Select target model
  let targetModel = cleanPreferred;
  if (!availableModels.includes(targetModel)) {
    // Priority order to try
    const candidates = [
      cleanPreferred,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-pro',
    ];

    const match = candidates.find((c) => availableModels.includes(c)) || availableModels[0];
    if (match) {
      console.log(`[Gemini Auto-Select] Using supported model '${match}' instead of '${cleanPreferred}'`);
      targetModel = match;
    }
  }

  // Convert standard messages format [{ role: 'user' | 'assistant', content: string }] to Gemini API format
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Models to attempt if 404 occurs
  const modelsToAttempt = [targetModel, 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-pro'].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  const { headers: authHeaders, queryParam } = getGeminiAuth(apiKey);
  let lastError = null;

  for (const currentModel of modelsToAttempt) {
    const isPro = currentModel.includes('gemini-pro') && !currentModel.includes('1.5');
    const endpoint = stream
      ? `https://generativelanguage.googleapis.com/${apiVersion}/models/${currentModel}:streamGenerateContent${queryParam ? queryParam + '&alt=sse' : '?alt=sse'}`
      : `https://generativelanguage.googleapis.com/${apiVersion}/models/${currentModel}:generateContent${queryParam}`;

    const payload = {
      contents: [...contents],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    // If older model does not support systemInstruction, prepend to user message
    if (isPro) {
      if (payload.contents.length > 0 && payload.contents[0].parts.length > 0) {
        payload.contents[0].parts[0].text = `[CHỈ DẪN HỆ THỐNG]:\n${systemInstruction}\n\n[CÂU HỎI]:\n${payload.contents[0].parts[0].text}`;
      }
    } else {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404) {
          console.warn(`[Gemini 404 on ${currentModel}]: Trying alternative model...`);
          lastError = new Error(`Google Gemini API error (404): ${errorText}`);
          continue; // try next candidate model
        }
        throw new Error(`Google Gemini API error (${response.status}): ${errorText}`);
      }

      if (stream) {
        return response.body; // ReadableStream
      }

      const data = await response.json();
      const replyText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi chưa thể xử lý yêu cầu lúc này.';
      return replyText;
    } catch (err) {
      lastError = err;
      if (!err.message.includes('404')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Không thể kết nối với mô hình Google Gemini');
}

/**
 * Direct call to OpenAI REST API
 */
async function callOpenAiApi({ messages, systemInstruction, apiKey, model = 'gpt-4o-mini', stream = false }) {
  const formattedMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1024,
      stream,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  if (stream) {
    return response.body;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Xin lỗi, tôi chưa thể xử lý yêu cầu lúc này.';
}

/**
 * Fallback response generator when no API key is yet configured
 * This guarantees the store never crashes and still delivers helpful product suggestions!
 */
function generateOfflineMockResponse(userQuery, context) {
  const matched = context.matchedProducts || [];

  if (matched.length > 0) {
    const productListMarkdown = matched
      .slice(0, 4)
      .map(
        (p) =>
          `• **${p.name}**\n  - Giá: **$${p.price.toFixed(2)}** ${p.hasDiscount ? `*(giá gốc: $${p.originalPrice.toFixed(2)})*` : ''}\n  - Trạng thái: ${p.stockCount > 0 ? `Còn hàng (${p.stockCount} chiếc)` : 'Tạm hết hàng'}\n  - 👉 [Xem chi tiết sản phẩm](/product/${p.slug})`
      )
      .join('\n\n');

    return `Chào bạn! Tôi là **HobbyBot** - Trợ lý tư vấn bán hàng của **Hobby Vault** 🤖✨

Dựa trên yêu cầu của bạn, tôi xin gợi ý một số sản phẩm đang được yêu thích tại cửa hàng:

${productListMarkdown}

Bạn có muốn biết thêm chi tiết về thông số kỹ thuật, cách chơi hay chính sách bảo hành của sản phẩm nào ở trên không?`;
  }

  return `Chào bạn! Tôi là **HobbyBot** - Trợ lý tư vấn sản phẩm tại **Hobby Vault** 🤖

Chúng tôi chuyên cung cấp:
- 🌟 **Anime Figures & Nendoroids**: Mô hình chính hãng Nhật Bản từ Alter, Good Smile Company,...
- ⚔️ **Warhammer 40k & Age of Sigmar**: Miniature lắp ráp, sơn màu, quân đoàn Imperium, Chaos, Xenos.
- 🎲 **Board Games quốc tế**: Các tựa game chiến thuật hàng đầu thế giới.

Bạn đang tìm kiếm sản phẩm cho nhân vật nào, hoặc tầm ngân sách khoảng bao nhiêu để tôi hỗ trợ nhé?`;
}

/**
 * Main Service entry point
 */
async function processChatMessage({ messages, stream = false }) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array is required');
  }

  // Get the latest customer question
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const userQuery = lastUserMessage ? lastUserMessage.content : '';

  // 1. Context injection from MongoDB
  const context = await retrieveContext(userQuery);
  const systemInstruction = buildSystemPrompt(context);

  // 2. Identify provider and key
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  // If Gemini selected and key present
  if (provider === 'gemini' && geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    try {
      const geminiRes = await callGeminiApi({ messages, systemInstruction, apiKey: geminiKey, model, stream });
      return {
        stream,
        source: 'gemini',
        response: geminiRes,
        matchedProducts: context.matchedProducts,
      };
    } catch (err) {
      console.error('[Gemini API Call Failed]:', err.message);
      // If OpenAI key is also present, try OpenAI as secondary fallback
      if (openAiKey && openAiKey !== 'your_openai_api_key_here') {
        try {
          console.log('[AI Fallback]: Attempting OpenAI fallback...');
          const openAiRes = await callOpenAiApi({ messages, systemInstruction, apiKey: openAiKey, model: process.env.OPENAI_MODEL || 'gpt-4o-mini', stream });
          return {
            stream,
            source: 'openai',
            response: openAiRes,
            matchedProducts: context.matchedProducts,
          };
        } catch (openAiErr) {
          console.error('[OpenAI Fallback Failed]:', openAiErr.message);
        }
      }

      // Context-based clean response with store products
      const offlineText = generateOfflineMockResponse(userQuery, context);
      return {
        stream: false,
        source: 'fallback',
        response: offlineText,
        matchedProducts: context.matchedProducts,
      };
    }
  }

  // If OpenAI selected or fallback to OpenAI
  if ((provider === 'openai' || (!geminiKey && openAiKey)) && openAiKey && openAiKey !== 'your_openai_api_key_here') {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    try {
      const openAiRes = await callOpenAiApi({ messages, systemInstruction, apiKey: openAiKey, model, stream });
      return {
        stream,
        source: 'openai',
        response: openAiRes,
        matchedProducts: context.matchedProducts,
      };
    } catch (err) {
      console.error('[OpenAI API Call Failed]:', err.message);
      const offlineText = generateOfflineMockResponse(userQuery, context);
      return {
        stream: false,
        source: 'fallback',
        response: offlineText,
        matchedProducts: context.matchedProducts,
      };
    }
  }

  // If no API key configured, use the smart context-based offline response
  const offlineText = generateOfflineMockResponse(userQuery, context);
  return {
    stream: false,
    source: 'offline-context',
    response: offlineText,
    matchedProducts: context.matchedProducts,
  };
}

module.exports = {
  retrieveContext,
  buildSystemPrompt,
  processChatMessage,
};
