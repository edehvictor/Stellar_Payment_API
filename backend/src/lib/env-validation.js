function validateEnvironmentVariables() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STELLAR_NETWORK',
    'DATABASE_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('\nPlease set these variables in your .env file or environment.');
    process.exit(1);
  }

  const validNetworks = ['testnet', 'public'];
  if (!validNetworks.includes(process.env.STELLAR_NETWORK)) {
    console.error(`❌ Invalid STELLAR_NETWORK: ${process.env.STELLAR_NETWORK}`);
    console.error(`Valid options: ${validNetworks.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

export { validateEnvironmentVariables };
