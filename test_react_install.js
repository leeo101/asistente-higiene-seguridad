try {
    require('react');
    console.log('React is installed');
} catch (e) {
    console.error('React is NOT installed: ' + e.message);
    process.exit(1);
}
