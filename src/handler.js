import { userState } from './userState.js';

export async function handler(sock, msg) {
  // Check if message exists
  if (!msg?.message) return;
  
  const from = msg.key.remoteJid;
  
  // Get user state or create new one
  const state = userState.get(from) || { 
    step: 'start', 
    page: 1, 
    company: null 
  };
  
  console.log(`📱 User: ${from}`);
  console.log(`📊 State: ${JSON.stringify(state)}`);

  // Ignore group messages
  if (from.endsWith('@g.us')) {
    console.log(`🚫 Ignoring group message`);
    return;
  }

  // Ignore messages sent by the bot itself
  if (msg.key.fromMe) {
    console.log(`🤖 Ignoring bot's own message`);
    return;
  }

  // Extract text from message
  let text = '';
  
  if (msg.message.conversation) {
    // Simple text message
    text = msg.message.conversation.trim();
  } else if (msg.message.extendedTextMessage?.text) {
    // Extended text message
    text = msg.message.extendedTextMessage.text.trim();
  } else if (msg.message.buttonsResponseMessage?.selectedButtonId) {
    // Button response
    text = msg.message.buttonsResponseMessage.selectedButtonId;
  } else if (msg.message.listResponseMessage?.singleSelectReply?.selectedRowId) {
    // List response
    text = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
  }
  
  console.log(`📩 Message text: "${text}"`);

  // FIRST MESSAGE: Always show welcome menu for new users
  if (state.step === 'start') {
    console.log(`✅ First time user, showing welcome menu`);
    await sendWelcomeMenu(sock, from);
    userState.set(from, { step: 'welcome', page: 1, company: null });
    return;
  }

  // Handle company selection
  if (text === '1' || text.toLowerCase().includes('software')) {
    console.log(`🚀 Software Solutions selected`);
    await sendSoftwareMenu(sock, from, 1);
    userState.set(from, { step: 'software', page: 1, company: 'software' });
    return;
  }

  if (text === '2' || text.toLowerCase().includes('digital')) {
    console.log(`📱 Digital Works selected`);
    await sendDigitalMenu(sock, from, 1);
    userState.set(from, { step: 'digital', page: 1, company: 'digital' });
    return;
  }

  // Handle navigation buttons
  if (text === 'next_page') {
    console.log(`➡️ Next page requested`);
    if (state.company === 'software') {
      const newPage = Math.min(state.page + 1, 3); // Max 3 pages for software
      await sendSoftwareMenu(sock, from, newPage);
      userState.set(from, { ...state, page: newPage });
    } else if (state.company === 'digital') {
      const newPage = Math.min(state.page + 1, 4); // Max 4 pages for digital
      await sendDigitalMenu(sock, from, newPage);
      userState.set(from, { ...state, page: newPage });
    }
    return;
  }

  if (text === 'prev_page') {
    console.log(`⬅️ Previous page requested`);
    if (state.company === 'software' && state.page > 1) {
      const newPage = Math.max(state.page - 1, 1);
      await sendSoftwareMenu(sock, from, newPage);
      userState.set(from, { ...state, page: newPage });
    } else if (state.company === 'digital' && state.page > 1) {
      const newPage = Math.max(state.page - 1, 1);
      await sendDigitalMenu(sock, from, newPage);
      userState.set(from, { ...state, page: newPage });
    }
    return;
  }

  if (text === 'back_to_welcome') {
    console.log(`🏠 Back to main menu`);
    await sendWelcomeMenu(sock, from);
    userState.set(from, { step: 'welcome', page: 1, company: null });
    return;
  }

  if (text === 'contact_info') {
    console.log(`📞 Contact info requested`);
    await sock.sendMessage(from, {
      text: `📞 *Contact Information*\n\n` +
            `*NovoNex Software Solutions:*\n` +
            `📱 Hotline: 077 069 1283\n` +
            `📧 Email: novonexlk@gmail.com\n\n` +
            `*NovoNex Digital Works:*\n` +
            `📱 Hotline: 075 339 4278\n` +
            `📧 Email: novonexlk@gmail.com`
    });
    return;
  }

  // Handle service selections
  if (text.startsWith('service')) {
    console.log(`🔧 Service selected: ${text}`);
    await handleServiceSelection(sock, from, text);
    return;
  }

  // If user sends any other message, show welcome menu
  console.log(`🔄 Random message, showing welcome menu`);
  await sendWelcomeMenu(sock, from);
  userState.set(from, { step: 'welcome', page: 1, company: null });
}

// Welcome Menu Function
async function sendWelcomeMenu(sock, from) {
  try {
    console.log(`📤 Sending welcome menu...`);
    
    await sock.sendMessage(from, {
      text: `🤖 *Welcome to NovoNex!*\n\n` +
            `We provide comprehensive technology and digital solutions for your business.\n\n` +
            `*Please select a service category:*\n\n` +
            `1️⃣ *NovoNex Software Solutions*\n` +
            `   - Custom Software Development\n` +
            `   - Web & Mobile Applications\n` +
            `   - System Integration\n\n` +
            `2️⃣ *NovoNex Digital Works*\n` +
            `   - Digital Marketing\n` +
            `   - Social Media Management\n` +
            `   - Branding & SEO\n\n` +
            `*Click a button below or type 1 or 2 to continue.*`,
      buttons: [
        {
          buttonId: '1',
          buttonText: { displayText: '🚀 Software Solutions' }
        },
        {
          buttonId: '2',
          buttonText: { displayText: '📱 Digital Works' }
        },
        {
          buttonId: 'contact_info',
          buttonText: { displayText: '📞 Contact Info' }
        }
      ]
    });
    
    console.log(`✅ Welcome menu sent successfully`);
  } catch (error) {
    console.error(`❌ Error sending welcome menu:`, error.message);
  }
}

// Software Solutions Menu
async function sendSoftwareMenu(sock, from, page = 1) {
  try {
    const pages = [
      {
        title: '🏢 NovoNex Software Solutions – Page 1/3',
        services: [
          { id: 'service1', title: '1️⃣ Custom Software Development' },
          { id: 'service2', title: '2️⃣ Web Application Development' },
          { id: 'service3', title: '3️⃣ Website Development' },
          { id: 'service4', title: '4️⃣ E-Commerce Solutions' }
        ]
      },
      {
        title: '🏢 NovoNex Software Solutions – Page 2/3',
        services: [
          { id: 'service5', title: '5️⃣ Mobile Application Development' },
          { id: 'service6', title: '6️⃣ UI / UX Design' },
          { id: 'service7', title: '7️⃣ AI & Automation Solutions' },
          { id: 'service8', title: '8️⃣ System Integration & API Development' }
        ]
      },
      {
        title: '🏢 NovoNex Software Solutions – Page 3/3',
        services: [
          { id: 'service9', title: '9️⃣ Cloud & Hosting Services' },
          { id: 'service10', title: '🔟 Maintenance & Technical Support' },
          { id: 'service11', title: '1️⃣1️⃣ Digital Solutions & Consulting' },
          { id: 'service12', title: '1️⃣2️⃣ Branding & Digital Presence' }
        ]
      }
    ];

    const currentPage = pages[page - 1];
    const buttons = [];

    // Previous button
    if (page > 1) {
      buttons.push({
        buttonId: 'prev_page',
        buttonText: { displayText: '⬅️ Previous' }
      });
    }

    // Main Menu button
    buttons.push({
      buttonId: 'back_to_welcome',
      buttonText: { displayText: '🏠 Main Menu' }
    });

    // Next button
    if (page < pages.length) {
      buttons.push({
        buttonId: 'next_page',
        buttonText: { displayText: 'Next ➡️' }
      });
    }

    // Contact button
    buttons.push({
      buttonId: 'contact_info',
      buttonText: { displayText: '📞 Contact' }
    });

    const serviceList = currentPage.services.map(s => s.title).join('\n');
    
    await sock.sendMessage(from, {
      text: `*${currentPage.title}*\n\n` +
            `*Select a service for details:*\n\n${serviceList}`,
      buttons: buttons
    });
    
    console.log(`✅ Software menu page ${page} sent`);
  } catch (error) {
    console.error(`❌ Error sending software menu:`, error.message);
  }
}

// Digital Works Menu
async function sendDigitalMenu(sock, from, page = 1) {
  try {
    const pages = [
      {
        title: '🚀 NovoNex Digital Works – Page 1/4',
        services: [
          { id: 'service13', title: '1️⃣ Digital Marketing Strategy' },
          { id: 'service14', title: '2️⃣ Social Media Marketing (SMM)' },
          { id: 'service15', title: '3️⃣ Social Media Advertising' }
        ]
      },
      {
        title: '🚀 NovoNex Digital Works – Page 2/4',
        services: [
          { id: 'service16', title: '4️⃣ Content Creation & Design' },
          { id: 'service17', title: '5️⃣ Search Engine Optimization (SEO)' },
          { id: 'service18', title: '6️⃣ Search Engine Marketing (SEM)' }
        ]
      },
      {
        title: '🚀 NovoNex Digital Works – Page 3/4',
        services: [
          { id: 'service19', title: '7️⃣ Branding & Brand Identity' },
          { id: 'service20', title: '8️⃣ Website & Funnel Marketing' },
          { id: 'service21', title: '9️⃣ Email & WhatsApp Marketing' }
        ]
      },
      {
        title: '🚀 NovoNex Digital Works – Page 4/4',
        services: [
          { id: 'service22', title: '🔟 Influencer & Video Marketing' },
          { id: 'service23', title: '1️⃣1️⃣ Analytics & Performance' },
          { id: 'service24', title: '1️⃣2️⃣ Local & Business Marketing' },
          { id: 'service25', title: '1️⃣3️⃣ Marketing Automation' }
        ]
      }
    ];

    const currentPage = pages[page - 1];
    const buttons = [];

    // Previous button
    if (page > 1) {
      buttons.push({
        buttonId: 'prev_page',
        buttonText: { displayText: '⬅️ Previous' }
      });
    }

    // Main Menu button
    buttons.push({
      buttonId: 'back_to_welcome',
      buttonText: { displayText: '🏠 Main Menu' }
    });

    // Next button
    if (page < pages.length) {
      buttons.push({
        buttonId: 'next_page',
        buttonText: { displayText: 'Next ➡️' }
      });
    }

    // Contact button
    buttons.push({
      buttonId: 'contact_info',
      buttonText: { displayText: '📞 Contact' }
    });

    const serviceList = currentPage.services.map(s => s.title).join('\n');
    
    await sock.sendMessage(from, {
      text: `*${currentPage.title}*\n\n` +
            `*Select a service for details:*\n\n${serviceList}`,
      buttons: buttons
    });
    
    console.log(`✅ Digital menu page ${page} sent`);
  } catch (error) {
    console.error(`❌ Error sending digital menu:`, error.message);
  }
}

// Handle Service Selection Details
async function handleServiceSelection(sock, from, serviceId) {
  try {
    console.log(`🔍 Showing details for: ${serviceId}`);
    
    const serviceDetails = {
      // Software Services
      'service1': `*1️⃣ Custom Software Development*\n\n` +
                  `• *Business Management Systems*\n` +
                  `• *Inventory / POS Systems*\n` +
                  `• *Accounting & Billing Systems*\n` +
                  `• *CRM / ERP Systems*\n\n` +
                  `📞 *Contact:* 077 069 1283\n` +
                  `📧 *Email:* novonexlk@gmail.com`,

      'service2': `*2️⃣ Web Application Development*\n\n` +
                  `• *Custom Web Applications*\n` +
                  `• *Admin Dashboards*\n` +
                  `• *Booking Systems*\n` +
                  `• *Learning Management Systems (LMS)*\n` +
                  `• *Job Portals / Classified Websites*\n` +
                  `• *SaaS Platforms*\n\n` +
                  `*Technologies:*\n` +
                  `React, Next.js, Node.js, PHP, Laravel, MySQL, Firebase\n\n` +
                  `📞 *Contact:* 077 069 1283\n` +
                  `📧 *Email:* novonexlk@gmail.com`,

      'service3': `*3️⃣ Website Development*\n\n` +
                  `• *Business Websites*\n` +
                  `• *Corporate Websites*\n` +
                  `• *Portfolio Websites*\n` +
                  `• *Blog & Content Websites*\n` +
                  `• *Landing Pages*\n` +
                  `• *Multi-language Websites*\n\n` +
                  `✔️ Mobile Friendly\n` +
                  `✔️ Fast Loading\n` +
                  `✔️ SEO Ready\n\n` +
                  `📞 *Contact:* 077 069 1283\n` +
                  `📧 *Email:* novonexlk@gmail.com`,

      'service4': `*4️⃣ E-Commerce Solutions*\n\n` +
                  `• *Online Store Development*\n` +
                  `• *Payment Gateway Integration*\n` +
                  `• *Product & Order Management*\n` +
                  `• *Customer Accounts*\n` +
                  `• *Admin Panel*\n` +
                  `• *Delivery & Invoice Systems*\n\n` +
                  `📞 *Contact:* 077 069 1283\n` +
                  `📧 *Email:* novonexlk@gmail.com`,

      'service5': `*5️⃣ Mobile Application Development*\n\n` +
                  `• *Android Applications*\n` +
                  `• *iOS Applications*\n` +
                  `• *Hybrid Apps (React Native / Flutter)*\n` +
                  `• *App UI Design*\n` +
                  `• *API Integration*\n\n` +
                  `📞 *Contact:* 077 069 1283\n` +
                  `📧 *Email:* novonexlk@gmail.com`,

      'service6': `*6️⃣ UI / UX Design*\n\n` +
                  `• *Website UI Design*\n` +
                  `• *Mobile App UI Design*\n` +
                  `• *Dashboard UI Design*\n` +
                  `• *User Experience Optimization*\n` +
                  `• *Figma / Adobe XD Designs*\n\n` +
                  `📞 *Contact:* 077 069 1283\n` +
                  `📧 *Email:* novonexlk@gmail.com`,

      'service7': `*7️⃣ AI & Automation Solutions*\n\n` +
                  `• *AI-powered Web Apps*\n` +
                  `• *Chatbots*\n` +
                  `• *Image / Content Generation Tools*\n` +
                  `• *Automation Systems*\n` +
                  `• *AI Integration for Businesses*\n\n` +
                  `📞 *Contact:* 077 069 1283\n` +
                  `📧 *Email:* novonexlk@gmail.com`,

      'service8': `*8️⃣ System Integration & API Development*\n\n` +
                  `• *Third-party API Integration*\n` +
                  `• *Payment Gateways*\n` +
                  `• *SMS / Email Systems*\n` +
                  `• *Maps & Location Services*\n` +
                  `• *ERP / CRM Integration*\n\n` +
                  `📞 *Contact:* 077 069 1283\n` +
                  `📧 *Email:* novonexlk@gmail.com`,

      'service9': `*9️⃣ Cloud & Hosting Services*\n\n` +
                  `• *Domain Registration*\n` +
                  `• *Web Hosting*\n` +
                  `• *Cloud Deployment*\n` +
                  `• *Server Setup & Maintenance*\n` +
                  `• *Backup & Security Management*\n\n` +
                  `📞 *Contact:* 077 069 1283\n` +
                  `📧 *Email:* novonexlk@gmail.com`,

      'service10': `*🔟 Maintenance & Technical Support*\n\n` +
                   `• *Software Maintenance*\n` +
                   `• *Bug Fixing*\n` +
                   `• *Feature Updates*\n` +
                   `• *Performance Optimization*\n` +
                   `• *Security Updates*\n\n` +
                   `📞 *Contact:* 077 069 1283\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service11': `*1️⃣1️⃣ Digital Solutions & Consulting*\n\n` +
                   `• *IT Consulting*\n` +
                   `• *Business Digital Transformation*\n` +
                   `• *System Planning & Architecture*\n` +
                   `• *Startup Tech Consultation*\n\n` +
                   `📞 *Contact:* 077 069 1283\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service12': `*1️⃣2️⃣ Branding & Digital Presence*\n\n` +
                   `• *Logo Design*\n` +
                   `• *Brand Identity*\n` +
                   `• *Website Content Setup*\n` +
                   `• *SEO Optimization*\n` +
                   `• *Social Media Integration*\n\n` +
                   `📞 *Contact:* 077 069 1283\n` +
                   `📧 *Email:* novonexlk@gmail.com`,
      
      // Digital Services
      'service13': `*1️⃣ Digital Marketing Strategy & Consulting*\n\n` +
                   `• *Business Digital Marketing Planning*\n` +
                   `• *Brand Growth Strategy*\n` +
                   `• *Campaign Planning*\n` +
                   `• *Market & Competitor Analysis*\n` +
                   `• *Marketing Consultation*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service14': `*2️⃣ Social Media Marketing (SMM)*\n\n` +
                   `• *Facebook Marketing*\n` +
                   `• *Instagram Marketing*\n` +
                   `• *TikTok Marketing*\n` +
                   `• *LinkedIn Marketing*\n` +
                   `• *YouTube Channel Management*\n\n` +
                   `✔️ Content Planning\n` +
                   `✔️ Post Designing\n` +
                   `✔️ Page Handling\n` +
                   `✔️ Engagement Growth\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service15': `*3️⃣ Social Media Advertising (Paid Ads)*\n\n` +
                   `• *Facebook & Instagram Ads*\n` +
                   `• *TikTok Ads*\n` +
                   `• *Google Display Ads*\n` +
                   `• *Lead Generation Campaigns*\n` +
                   `• *Conversion & Sales Ads*\n` +
                   `• *Retargeting Ads*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service16': `*4️⃣ Content Creation & Creative Design*\n\n` +
                   `• *Graphic Design (Posts, Banners, Flyers)*\n` +
                   `• *Video Editing (Reels, Shorts, Ads)*\n` +
                   `• *Motion Graphics*\n` +
                   `• *Brand Visual Design*\n` +
                   `• *AI-based Creative Content*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service17': `*5️⃣ Search Engine Optimization (SEO)*\n\n` +
                   `• *On-Page SEO*\n` +
                   `• *Technical SEO*\n` +
                   `• *Keyword Research*\n` +
                   `• *Content Optimization*\n` +
                   `• *Google Ranking Improvement*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service18': `*6️⃣ Search Engine Marketing (SEM)*\n\n` +
                   `• *Google Search Ads*\n` +
                   `• *Google Shopping Ads*\n` +
                   `• *Keyword Targeted Campaigns*\n` +
                   `• *ROI-focused Ad Management*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service19': `*7️⃣ Branding & Brand Identity*\n\n` +
                   `• *Logo Design*\n` +
                   `• *Brand Guidelines*\n` +
                   `• *Color & Typography System*\n` +
                   `• *Visual Identity Design*\n` +
                   `• *Brand Positioning*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service20': `*8️⃣ Website & Funnel Marketing*\n\n` +
                   `• *Landing Page Design*\n` +
                   `• *Sales Funnel Setup*\n` +
                   `• *Website Conversion Optimization*\n` +
                   `• *Lead Capture Forms*\n` +
                   `• *Email Integration*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service21': `*9️⃣ Email & WhatsApp Marketing*\n\n` +
                   `• *Email Campaigns*\n` +
                   `• *Newsletter Design*\n` +
                   `• *WhatsApp Bulk Messaging*\n` +
                   `• *Automation Setup*\n` +
                   `• *Customer Follow-up Systems*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service22': `*🔟 Influencer & Video Marketing*\n\n` +
                   `• *Influencer Collaborations*\n` +
                   `• *YouTube Video Marketing*\n` +
                   `• *Short-form Video Strategy*\n` +
                   `• *Reels & TikTok Growth Plans*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service23': `*1️⃣1️⃣ Analytics & Performance Tracking*\n\n` +
                   `• *Google Analytics Setup*\n` +
                   `• *Meta Pixel Integration*\n` +
                   `• *Campaign Performance Reports*\n` +
                   `• *Audience Behavior Analysis*\n` +
                   `• *Monthly Marketing Reports*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service24': `*1️⃣2️⃣ Local & Business Marketing*\n\n` +
                   `• *Google My Business Optimization*\n` +
                   `• *Local SEO*\n` +
                   `• *Map-based Business Promotion*\n` +
                   `• *Review & Reputation Management*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`,

      'service25': `*1️⃣3️⃣ Marketing Automation*\n\n` +
                   `• *CRM Integration*\n` +
                   `• *Auto Lead Response Systems*\n` +
                   `• *Chatbot Setup*\n` +
                   `• *AI Automation for Marketing*\n\n` +
                   `📞 *Contact:* 075 339 4278\n` +
                   `📧 *Email:* novonexlk@gmail.com`
    };

    const details = serviceDetails[serviceId] || 
      `*Service Details*\n\nService information not available.\n\n📞 *Contact:*\nNovoNex Software Solutions: 077 069 1283\nNovoNex Digital Works: 075 339 4278\n📧 *Email:* novonexlk@gmail.com`;

    await sock.sendMessage(from, {
      text: details,
      buttons: [
        {
          buttonId: 'back_to_welcome',
          buttonText: { displayText: '🏠 Main Menu' }
        },
        {
          buttonId: 'contact_info',
          buttonText: { displayText: '📞 More Info' }
        }
      ]
    });
    
    console.log(`✅ Service details sent for ${serviceId}`);
  } catch (error) {
    console.error(`❌ Error sending service details:`, error.message);
  }
}
