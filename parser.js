// Парсер страницы – оптимизированная версия (тесты проходят)
(() => {
    const trim = (s) => s?.trim() || '';
    const num = (s) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
    const currencyCode = (s) => s.includes('$') ? 'USD' : s.includes('€') ? 'EUR' : 'RUB';

    // Мета
    const pageTitle = () => document.title.split('—')[0].trim();
    const pageDesc = () => trim(document.querySelector('meta[name="description"]')?.content);
    const pageKeywords = () => (document.querySelector('meta[name="keywords"]')?.content || '')
        .split(',').map(trim);
    const openGraph = () => {
        const og = {};
        document.querySelectorAll('meta[property^="og:"]').forEach(tag => {
            let key = tag.getAttribute('property').slice(3);
            let val = trim(tag.getAttribute('content'));
            if (key === 'title') val = val.split('—')[0].trim();
            og[key] = val;
        });
        return og;
    };

    // Товар
    const productTags = () => {
        const tags = { category: [], discount: [], label: [] };
        document.querySelectorAll('.tags span').forEach(span => {
            const text = trim(span.textContent);
            if (span.classList.contains('green')) tags.category.push(text);
            else if (span.classList.contains('red')) tags.discount.push(text);
            else if (span.classList.contains('blue')) tags.label.push(text);
        });
        return tags;
    };

    const productPrices = () => {
        const container = document.querySelector('.price');
        if (!container) return { price:0, oldPrice:0, discount:0, discountPercent:'0%', currency:'RUB' };
        const currentText = container.childNodes[0]?.textContent || '';
        const currency = currencyCode(currentText);
        const price = num(currentText);
        const oldSpan = container.querySelector('span');
        let oldPrice = oldSpan ? num(oldSpan.textContent) : 0;
        const discount = oldPrice - price;
        let discountPercent = '0%';
        if (oldPrice > 0) discountPercent = ((discount / oldPrice) * 100).toFixed(2) + '%';
        return { price, oldPrice, discount, discountPercent, currency };
    };

    const productProperties = () => {
        const props = {};
        document.querySelectorAll('.properties li').forEach(li => {
            const spans = li.querySelectorAll('span');
            if (spans.length >= 2) props[trim(spans[0].textContent)] = trim(spans[1].textContent);
        });
        return props;
    };

    const productDescription = () => {
        const block = document.querySelector('.description');
        if (!block) return '';
        const clone = block.cloneNode(true);
        clone.querySelectorAll('*').forEach(el => { while (el.attributes.length) el.removeAttribute(el.attributes[0].name); });
        return clone.innerHTML.trim();
    };

    const productImages = () => {
        const images = [];
        document.querySelectorAll('.preview nav img').forEach(img => {
            images.push({
                preview: img.src,
                full: img.dataset.src || img.src,
                alt: img.alt || ''
            });
        });
        return images;
    };

    const productData = () => ({
        id: document.querySelector('.product')?.dataset.id || '',
        name: trim(document.querySelector('h1.title')?.textContent),
        isLiked: document.querySelector('.like')?.classList.contains('active') || false,
        tags: productTags(),
        ...productPrices(),
        properties: productProperties(),
        description: productDescription(),
        images: productImages()
    });

    // Предложенные товары
    const suggestedProducts = () => {
        const list = [];
        document.querySelectorAll('.suggested .items article').forEach(art => {
            const priceText = art.querySelector('b')?.textContent.trim() || '';
            list.push({
                name: trim(art.querySelector('h3')?.textContent),
                description: trim(art.querySelector('p')?.textContent),
                image: art.querySelector('img')?.src || '',
                price: priceText.replace(/[^0-9]/g, ''),
                currency: currencyCode(priceText)
            });
        });
        return list;
    };

    // Отзывы
    const reviewsList = () => {
        const reviews = [];
        document.querySelectorAll('.reviews .items article').forEach(art => {
            const rawDate = art.querySelector('.author i')?.textContent.trim() || '';
            reviews.push({
                rating: art.querySelectorAll('.rating .filled').length,
                author: {
                    avatar: art.querySelector('.author img')?.src || '',
                    name: trim(art.querySelector('.author span')?.textContent)
                },
                title: trim(art.querySelector('h3.title')?.textContent),
                description: trim(art.querySelector('div > p')?.textContent),
                date: rawDate.replace(/\//g, '.')
            });
        });
        return reviews;
    };

    // Главная функция
    window.parsePage = () => ({
        meta: {
            title: pageTitle(),
            description: pageDesc(),
            keywords: pageKeywords(),
            language: document.documentElement.lang || 'en',
            opengraph: { ...openGraph(), title: pageTitle() }
        },
        product: productData(),
        suggested: suggestedProducts(),
        reviews: reviewsList()
    });
})();