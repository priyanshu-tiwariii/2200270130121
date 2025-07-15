
let urls = [];


const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;


class UrlModel {
  constructor(originalUrl, shortcode, validity = 30, user = null) {
    this.id = Date.now().toString();
    this.originalUrl = originalUrl;
    this.shortcode = shortcode;
    this.createdAt = new Date().toISOString();
    this.expiry = new Date(Date.now() + validity * 60 * 1000).toISOString();
    this.validityMinutes = validity;
    this.totalClicks = 0;
    this.clicks = [];
    this.isActive = true;
    this.createdBy = user ? {
      email: user.email,
      rollNumber: user.rollNumber,
      clientId: user.clientId
    } : null;
  }
}


const urlUtils = {
  isValidUrl: (url) => {
    return URL_REGEX.test(url);
  },
  
  shortcodeExists: (shortcode) => {
    return urls.some(url => url.shortcode === shortcode);
  },
  
  addUrl: (originalUrl, shortcode, validity = 30, user = null) => {
    const newUrl = new UrlModel(originalUrl, shortcode, validity, user);
    urls.push(newUrl);
    return newUrl;
  },
  
  getUrlByShortcode: (shortcode) => {
    return urls.find(url => url.shortcode === shortcode);
  },
  

  getAllUrls: () => {
    return urls;
  },
  

  getUrlsByUser: (userEmail) => {
    return urls.filter(url => 
      url.createdBy && url.createdBy.email === userEmail
    );
  },
  

  getUrlStatistics: (shortcode) => {
    const url = urls.find(u => u.shortcode === shortcode);
    if (!url) return null;
    
    return {
      shortcode: url.shortcode,
      originalUrl: url.originalUrl,
      shortLink: `http://localhost:5000/${url.shortcode}`,
      createdAt: url.createdAt,
      expiry: url.expiry,
      validityMinutes: url.validityMinutes,
      totalClicks: url.totalClicks,
      isActive: url.isActive,
      createdBy: url.createdBy,
      clickData: url.clicks.map(click => ({
        timestamp: click.timestamp,
        source: click.source,
        userAgent: click.userAgent,
        location: click.location,
        ip: click.ip ? click.ip.replace(/\d+$/, 'xxx') : 'unknown'
      }))
    };
  },
  
 
  clearExpiredUrls: () => {
    const now = new Date();
    const expiredCount = urls.filter(url => new Date(url.expiry) <= now).length;
    urls = urls.filter(url => new Date(url.expiry) > now);
    return expiredCount;
  },

 
  
  getAnalyticsSummary: (userEmail = null) => {
    let targetUrls = urls;
    
    if (userEmail) {
      targetUrls = urls.filter(url => 
        url.createdBy && url.createdBy.email === userEmail
      );
    }
    
    const now = new Date();
    const activeUrls = targetUrls.filter(url => new Date(url.expiry) > now);
    const expiredUrls = targetUrls.filter(url => new Date(url.expiry) <= now);
    const totalClicks = targetUrls.reduce((sum, url) => sum + url.totalClicks, 0);
    
    return {
      totalUrls: targetUrls.length,
      activeUrls: activeUrls.length,
      expiredUrls: expiredUrls.length,
      totalClicks,
      averageClicksPerUrl: targetUrls.length > 0 ? (totalClicks / targetUrls.length).toFixed(2) : 0
    };
  }
};

module.exports = {
  urls,
  UrlModel,
  urlUtils
};