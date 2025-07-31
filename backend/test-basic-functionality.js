const RegionConfigService = require('./src/services/regionConfigService');
const MarginService = require('./src/services/marginService');
const DerivativesService = require('./src/services/derivativesService');
const SettlementService = require('./src/services/settlementService');

async function testBasicFunctionality() {
  console.log('Testing basic derivatives functionality...');

  try {
    // Initialize services
    const regionConfigService = new RegionConfigService();
    const marginService = new MarginService(regionConfigService);
    const derivativesService = new DerivativesService(regionConfigService, marginService);
    const settlementService = new SettlementService(regionConfigService);

    console.log('✓ Services initialized successfully');

    // Test region configuration
    const usConfig = await regionConfigService.getRegionConfig('US');
    console.log('✓ US configuration retrieved:', usConfig.currency, usConfig.isActive);

    // Test derivatives creation
    const futureContract = await derivativesService.createFutureContract({
      underlyingCommodity: 'crude_oil',
      notionalAmount: 1000000,
      deliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      settlementType: 'cash',
      region: 'US',
      userId: 'test-user-id'
    });
    console.log('✓ Future contract created:', futureContract.id, futureContract.marginRequirement);

    // Test option creation
    const optionContract = await derivativesService.createOptionContract({
      underlyingCommodity: 'natural_gas',
      notionalAmount: 500000,
      optionType: 'call',
      strikePrice: 3.5,
      expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      region: 'US',
      userId: 'test-user-id'
    });
    console.log('✓ Option contract created:', optionContract.id, 'Premium:', optionContract.premium);

    // Test margin calculation
    const portfolioMargin = await marginService.calculatePortfolioMargin('test-user-id', 'US');
    console.log('✓ Portfolio margin calculated:', portfolioMargin.totalInitialMargin);

    // Test settlement instruction
    const settlementInstruction = await settlementService.createSettlementInstruction({
      contractId: futureContract.id,
      userId: 'test-user-id',
      settlementType: 'cash',
      amount: 1000000,
      currency: 'USD',
      region: 'US'
    });
    console.log('✓ Settlement instruction created:', settlementInstruction.id, settlementInstruction.status);

    // Cleanup
    marginService.stopMarginMonitoring();
    settlementService.stopSettlementMonitoring();

    console.log('\n🎉 All basic functionality tests passed!');
    
    return {
      futureContract,
      optionContract,
      portfolioMargin,
      settlementInstruction
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testBasicFunctionality()
    .then((results) => {
      console.log('\nTest Results Summary:');
      console.log('- Future Contract ID:', results.futureContract.id);
      console.log('- Option Contract ID:', results.optionContract.id);
      console.log('- Portfolio Margin:', results.portfolioMargin.totalInitialMargin);
      console.log('- Settlement ID:', results.settlementInstruction.id);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testBasicFunctionality;