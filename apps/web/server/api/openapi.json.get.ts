import type { OpenAPI3 } from '../types/openapi'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/json; charset=utf-8')

  const { public: publicConfig } = useRuntimeConfig()

  const spec: OpenAPI3 = {
    openapi: '3.0.3',
    info: {
      title: publicConfig.siteName || '导航站 API',
      version: '0.1.0'
    },
    servers: publicConfig.siteUrl ? [{ url: publicConfig.siteUrl }] : [{ url: 'http://localhost:8998' }],
    paths: {
      '/api/health': {
        get: {
          summary: '健康检查',
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      mysql: { type: 'string', enum: ['connected', 'disabled', 'error'] }
                    },
                    required: ['ok', 'mysql']
                  }
                }
              }
            }
          }
        }
      },
      '/api/categories': {
        get: {
          summary: '获取分类列表',
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        sort: { type: 'integer' }
                      },
                      required: ['id', 'name', 'slug', 'sort']
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/submissions': {
        post: {
          summary: '申请收录提交',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    url: { type: 'string' },
                    description: { type: 'string' },
                    contact: { type: 'string' }
                  },
                  required: ['title', 'url']
                }
              }
            }
          },
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/guestbook': {
        get: {
          summary: '获取留言列表（公开可见）',
          parameters: [{ name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK' } }
        },
        post: {
          summary: '提交留言',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nickname: { type: 'string' },
                    content: { type: 'string' }
                  },
                  required: ['content']
                }
              }
            }
          },
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/links': {
        get: {
          summary: '获取导航链接列表',
          parameters: [
            { name: 'categoryId', in: 'query', required: false, schema: { type: 'integer' } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }
          ],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        categoryId: { type: ['integer', 'null'] },
                        title: { type: 'string' },
                        url: { type: 'string' },
                        description: { type: 'string' },
                        iconUrl: { type: 'string' },
                        isActive: { type: 'boolean' },
                        sort: { type: 'integer' }
                      },
                      required: ['id', 'categoryId', 'title', 'url', 'description', 'iconUrl', 'isActive', 'sort']
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/admin/auth/login': {
        post: {
          summary: '后台：登录',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { username: { type: 'string' }, password: { type: 'string' } },
                  required: ['username', 'password']
                }
              }
            }
          },
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/auth/logout': {
        post: {
          summary: '后台：登出',
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/auth/me': {
        get: {
          summary: '后台：当前登录信息',
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/admin-users': {
        get: { summary: '后台：管理员列表（super）', responses: { '200': { description: 'OK' } } },
        post: { summary: '后台：创建管理员（super）', responses: { '200': { description: 'OK' } } }
      },
      '/api/admin/admin-users/{id}': {
        put: {
          summary: '后台：更新管理员（super）',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/categories': {
        get: { summary: '后台：分类列表', responses: { '200': { description: 'OK' } } },
        post: { summary: '后台：创建分类', responses: { '200': { description: 'OK' } } }
      },
      '/api/admin/categories/{id}': {
        put: {
          summary: '后台：更新分类',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK' } }
        },
        delete: {
          summary: '后台：删除分类',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/links': {
        get: {
          summary: '后台：查询链接',
          parameters: [
            { name: 'q', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'categoryId', in: 'query', required: false, schema: { type: 'integer' } },
            { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }
          ],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      list: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            categoryId: { type: ['integer', 'null'] },
                            title: { type: 'string' },
                            url: { type: 'string' },
                            description: { type: 'string' },
                            iconUrl: { type: 'string' },
                            isActive: { type: 'boolean' },
                            isRecommended: { type: 'boolean' },
                            sort: { type: 'integer' },
                            createdAt: { type: 'string' },
                            updatedAt: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: '后台：创建链接',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    categoryId: { type: ['integer', 'null'] },
                    title: { type: 'string' },
                    url: { type: 'string' },
                    description: { type: 'string' },
                    iconUrl: { type: 'string' },
                    isActive: { type: 'boolean' },
                    sort: { type: 'integer' }
                  },
                  required: ['title', 'url']
                }
              }
            }
          },
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/links/{id}': {
        put: {
          summary: '后台：更新链接',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } }
          },
          responses: { '200': { description: 'OK' } }
        },
        delete: {
          summary: '后台：删除链接',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/submissions': {
        get: {
          summary: '后台：申请收录列表',
          parameters: [
            { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'q', in: 'query', required: false, schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/submissions/{id}': {
        put: {
          summary: '后台：处理申请收录（approve/reject）',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/guestbook': {
        get: {
          summary: '后台：留言列表',
          parameters: [{ name: 'visible', in: 'query', required: false, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK' } }
        }
      },
      '/api/admin/guestbook/{id}': {
        put: {
          summary: '后台：更新留言可见性',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK' } }
        },
        delete: {
          summary: '后台：删除留言',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK' } }
        }
      }
    }
  }

  return spec
})
