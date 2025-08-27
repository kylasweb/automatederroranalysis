import { db } from '@/lib/db';

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Create admin user
    const adminUser = await db.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'System Administrator',
        role: 'SUPER_ADMIN' as const,
      },
    });

    console.log('Admin user created:', adminUser.email);

    // Create sample users
    const sampleUsers = [
      { email: 'john.doe@example.com', name: 'John Doe', role: 'USER' as const },
      { email: 'jane.smith@example.com', name: 'Jane Smith', role: 'ADMIN' as const },
      { email: 'bob.johnson@example.com', name: 'Bob Johnson', role: 'USER' as const },
      { email: 'alice.brown@example.com', name: 'Alice Brown', role: 'USER' as const },
    ];

    for (const userData of sampleUsers) {
      const user = await db.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData,
      });
      console.log('Sample user created:', user.email);
    }

    // Create sample system settings
    const settings = [
      { key: 'ai_max_tokens', value: '1000' },
      { key: 'ai_temperature', value: '0.7' },
      { key: 'analysis_max_file_size', value: '10485760' }, // 10MB
      { key: 'system_maintenance_mode', value: 'false' },
      { key: 'notifications_enabled', value: 'true' },
    ];

    for (const setting of settings) {
      await db.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }

    console.log('System settings created');

    // Create sample analyses
    const createdAnalyses: any[] = [];
    const analyses = [
      {
        userId: adminUser.id,
        title: 'Node.js Memory Leak Analysis',
        logContent: 'Error: Out of memory at JavaScriptHeap::AllocateRaw',
        techStack: 'Node.js',
        environment: 'Production',
        analysis: 'Memory leak detected in Node.js application. Consider increasing heap limit or optimizing memory usage.',
        confidence: 0.92,
        source: 'Grok',
      },
      {
        userId: adminUser.id,
        title: 'Python Exception Analysis',
        logContent: 'Traceback (most recent call last): File "app.py", line 42, in main',
        techStack: 'Python',
        environment: 'Development',
        analysis: 'Python exception occurred. Check line 42 in app.py for potential null pointer or undefined variable.',
        confidence: 0.87,
        source: 'Gemini',
      },
    ];

    for (const analysisData of analyses) {
      const analysis = await db.analysis.create({
        data: analysisData,
      });
      createdAnalyses.push(analysis);
      console.log('Sample analysis created:', analysis.title);
    }

    // Create sample alerts
    const alerts = [
      {
        analysisId: createdAnalyses[0].id,
        type: 'ANALYSIS_COMPLETED' as const,
        message: 'Analysis completed successfully with 92% confidence',
        status: 'SENT' as const,
      },
      {
        analysisId: createdAnalyses[1].id,
        type: 'ANALYSIS_COMPLETED' as const,
        message: 'Analysis completed successfully with 87% confidence',
        status: 'SENT' as const,
      },
    ];

    for (const alertData of alerts) {
      const alert = await db.alert.create({
        data: alertData,
      });
      console.log('Sample alert created:', alert.message);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run the seed function
seedDatabase();