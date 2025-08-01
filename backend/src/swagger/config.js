const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const fs = require('fs');
const yaml = require('yamljs');

// Load paths from YAML file
let yamlPaths = {};
try {
  const yamlPath = path.join(__dirname, 'openapi.yaml');
  if (fs.existsSync(yamlPath)) {
    const yamlSpec = yaml.load(yamlPath);
    yamlPaths = yamlSpec.paths || {};
  }
} catch (error) {
  console.warn('Failed to load paths from YAML:', error);
}

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'QuantEnergx API',
      version: '2.0.0',
      description: `
        Industry-disrupting energy trading platform with advanced features across 13 major categories.
        
        ## Features
        - Real-time trading infrastructure
        - Multi-commodity support (Oil, Gas, Electricity, Renewables, Carbon Credits)
        - Derivatives trading (Futures, Options, Swaps, Structured Notes)
        - Advanced risk management with VaR calculations
        - Multi-exchange connectivity (ICE, EEX, CME, NYMEX, DME, OPEC)
        - Compliance across multiple jurisdictions (MiFID II, REMIT, Dodd-Frank, EMIR)
        - Settlement processing (Cash/Physical/Net)
        - Plugin architecture and webhook integrations
        - OCR document processing
        - IoT and SCADA integration
      `,
      contact: {
        name: 'QuantEnergx Team',
        url: 'https://github.com/akramahmed1/quantenergx',
        email: 'support@quantenergx.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.quantenergx.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        APIResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            data: {
              type: 'object'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['success', 'timestamp']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string'
            },
            message: {
              type: 'string'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['success', 'error', 'timestamp']
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            commodity: {
              type: 'string',
              enum: ['crude_oil', 'natural_gas', 'heating_oil', 'gasoline', 'electricity', 'coal']
            },
            quantity: {
              type: 'number',
              minimum: 1
            },
            price: {
              type: 'number',
              minimum: 0
            },
            side: {
              type: 'string',
              enum: ['buy', 'sell']
            },
            orderType: {
              type: 'string',
              enum: ['market', 'limit', 'stop', 'stop_limit']
            },
            status: {
              type: 'string',
              enum: ['pending', 'executed', 'cancelled', 'rejected']
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['commodity', 'quantity', 'side', 'orderType']
        },
        MarketData: {
          type: 'object',
          properties: {
            commodity: {
              type: 'string'
            },
            price: {
              type: 'number'
            },
            change: {
              type: 'number'
            },
            changePercent: {
              type: 'number'
            },
            volume: {
              type: 'number'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Plugin: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            },
            type: {
              type: 'string',
              enum: ['data_source', 'analytics', 'risk', 'compliance', 'execution']
            },
            version: {
              type: 'string'
            },
            enabled: {
              type: 'boolean'
            },
            description: {
              type: 'string'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ErrorResponse' },
                  {
                    type: 'object',
                    properties: {
                      error: {
                        example: 'Unauthorized'
                      },
                      message: {
                        example: 'Invalid or expired token'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ErrorResponse' },
                  {
                    type: 'object',
                    properties: {
                      error: {
                        example: 'Not Found'
                      },
                      message: {
                        example: 'Resource not found'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ErrorResponse' },
                  {
                    type: 'object',
                    properties: {
                      error: {
                        example: 'Internal Server Error'
                      },
                      message: {
                        example: 'An unexpected error occurred'
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: yamlPaths
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../server.ts'),
    path.join(__dirname, './openapi.yaml')
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;