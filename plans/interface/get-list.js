const getList = async () => {
    const url = 'https://market.paic.com.cn/api/skills/list';

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': '',
        'Referer': 'https://market.paic.com.cn/',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            body: null
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching list:', error);
        throw error;
    }
};

export default getList;
