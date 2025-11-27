/**
 * BNI 최강챕터 - Data Management Module
 * RESTful API를 통해 테이블 데이터를 관리합니다.
 */

const DataService = {
  // API Base URL (상대 경로 사용)
  baseUrl: 'tables',
  
  // Cache for data
  cache: {
    categories: null,
    subcategories: null,
    members: null,
    advertisements: null
  },
  
  /**
   * Fetch data from table with pagination
   */
  async fetchTable(tableName, options = {}) {
    const { page = 1, limit = 100, search = '', sort = '' } = options;
    let url = `${this.baseUrl}/${tableName}?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sort) url += `&sort=${sort}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
  },
  
  /**
   * Get single record by ID
   */
  async getById(tableName, id) {
    try {
      const response = await fetch(`${this.baseUrl}/${tableName}/${id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${tableName}/${id}:`, error);
      return null;
    }
  },
  
  /**
   * Create new record
   */
  async create(tableName, data) {
    try {
      const response = await fetch(`${this.baseUrl}/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error creating ${tableName}:`, error);
      return null;
    }
  },
  
  /**
   * Update record
   */
  async update(tableName, id, data) {
    try {
      const response = await fetch(`${this.baseUrl}/${tableName}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating ${tableName}/${id}:`, error);
      return null;
    }
  },
  
  /**
   * Delete record
   */
  async delete(tableName, id) {
    try {
      const response = await fetch(`${this.baseUrl}/${tableName}/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error(`Error deleting ${tableName}/${id}:`, error);
      return false;
    }
  },
  
  // =====================
  // Specialized Methods
  // =====================
  
  /**
   * Get all categories
   */
  async getCategories() {
    if (this.cache.categories) return this.cache.categories;
    const data = await this.fetchTable('categories', { sort: 'order' });
    this.cache.categories = data.sort((a, b) => (a.order || 0) - (b.order || 0));
    return this.cache.categories;
  },
  
  /**
   * Get subcategories by category ID
   */
  async getSubcategories(categoryId = null) {
    if (!this.cache.subcategories) {
      const data = await this.fetchTable('subcategories', { sort: 'order' });
      this.cache.subcategories = data.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    if (categoryId) {
      return this.cache.subcategories.filter(sub => sub.category_id === categoryId);
    }
    return this.cache.subcategories;
  },
  
  /**
   * Get all members with optional filters
   */
  async getMembers(filters = {}) {
    if (!this.cache.members) {
      const data = await this.fetchTable('members', { sort: 'order' });
      this.cache.members = data.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    let members = [...this.cache.members];
    
    // Apply filters
    if (filters.categoryId) {
      members = members.filter(m => m.category_id === filters.categoryId);
    }
    if (filters.subcategoryId) {
      members = members.filter(m => m.subcategory_id === filters.subcategoryId);
    }
    if (filters.region) {
      members = members.filter(m => m.region && m.region.includes(filters.region));
    }
    if (filters.featured) {
      members = members.filter(m => m.is_featured);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      members = members.filter(m => 
        m.name?.toLowerCase().includes(searchLower) ||
        m.company?.toLowerCase().includes(searchLower) ||
        m.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        m.usp_summary?.toLowerCase().includes(searchLower)
      );
    }
    
    return members;
  },
  
  /**
   * Get featured members
   */
  async getFeaturedMembers() {
    return this.getMembers({ featured: true });
  },
  
  /**
   * Get member by ID
   */
  async getMember(id) {
    const members = await this.getMembers();
    return members.find(m => m.id === id);
  },
  
  /**
   * Get active advertisements
   */
  async getAdvertisements(position = null) {
    if (!this.cache.advertisements) {
      const data = await this.fetchTable('advertisements', { sort: 'order' });
      this.cache.advertisements = data
        .filter(ad => ad.is_active)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    if (position) {
      return this.cache.advertisements.filter(ad => ad.position === position);
    }
    return this.cache.advertisements;
  },
  
  /**
   * Submit visitor inquiry
   */
  async submitInquiry(data) {
    const inquiryData = {
      ...data,
      status: 'pending',
      inquiry_type: data.inquiry_type || 'visitor'
    };
    return this.create('visitor_inquiries', inquiryData);
  },
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {
      categories: null,
      subcategories: null,
      members: null,
      advertisements: null
    };
  },
  
  /**
   * Get category by ID
   */
  async getCategory(id) {
    const categories = await this.getCategories();
    return categories.find(c => c.id === id);
  },
  
  /**
   * Get subcategory by ID
   */
  async getSubcategory(id) {
    const subcategories = await this.getSubcategories();
    return subcategories.find(s => s.id === id);
  },
  
  /**
   * Log click action for analytics
   * @param {string} memberId - Member ID
   * @param {string} actionType - Action type: phone, homepage, sns, kakao, profile_view
   */
  async logClick(memberId, actionType) {
    try {
      const logData = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        member_id: memberId,
        action_type: actionType,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || 'direct'
      };
      
      // Fire and forget - don't wait for response
      fetch(`${this.baseUrl}/click_logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      }).catch(err => console.log('Click log error:', err));
      
      return true;
    } catch (error) {
      console.log('Click log error:', error);
      return false;
    }
  }
};

// =====================
// Click Tracking Helper
// =====================
const ClickTracker = {
  /**
   * Initialize click tracking on member action buttons
   */
  init() {
    // Use event delegation for dynamic content
    document.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('.member-action-btn, .contact-btn');
      if (!actionBtn) return;
      
      // Get member ID from parent card or page
      let memberId = null;
      const memberCard = actionBtn.closest('.member-card');
      if (memberCard) {
        memberId = memberCard.dataset.id;
      } else {
        // Check URL for member page
        const params = new URLSearchParams(window.location.search);
        memberId = params.get('id');
      }
      
      if (!memberId) return;
      
      // Determine action type
      let actionType = 'profile_view';
      if (actionBtn.classList.contains('phone') || actionBtn.href?.startsWith('tel:')) {
        actionType = 'phone';
      } else if (actionBtn.classList.contains('kakao') || actionBtn.href?.includes('kakao')) {
        actionType = 'kakao';
      } else if (actionBtn.classList.contains('web') || actionBtn.classList.contains('homepage')) {
        actionType = 'homepage';
      } else if (actionBtn.classList.contains('sns') || actionBtn.href?.includes('instagram') || actionBtn.href?.includes('facebook')) {
        actionType = 'sns';
      }
      
      // Log the click
      DataService.logClick(memberId, actionType);
    });
  }
};

// Export for use in other modules
window.DataService = DataService;
window.ClickTracker = ClickTracker;
