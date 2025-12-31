const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'commands');
const results = {
    working: [],
    broken: [],
    disabled: [],
    unused: [],
    total: 0
};

console.log('🔍 Scanning all commands...\n');

const files = fs.readdirSync(commandsPath);

files.forEach(file => {
    if (!file.endsWith('.js') && !file.endsWith('.disabled')) return;

    results.total++;
    const commandPath = path.join(commandsPath, file);
    const commandName = file.replace('.js', '').replace('.disabled', '');

    // Check if disabled
    if (file.endsWith('.disabled')) {
        results.disabled.push({
            name: commandName,
            file: file,
            reason: 'File has .disabled extension'
        });
        return;
    }

    try {
        // Try to load the command
        const command = require(commandPath);

        // Check if it has proper structure
        if (typeof command === 'function') {
            results.working.push({
                name: commandName,
                file: file,
                type: 'function',
                size: fs.statSync(commandPath).size
            });
        } else if (command && typeof command.execute === 'function') {
            results.working.push({
                name: commandName,
                file: file,
                type: 'object with execute()',
                size: fs.statSync(commandPath).size
            });
        } else {
            results.broken.push({
                name: commandName,
                file: file,
                reason: 'No valid function or execute() method',
                type: typeof command
            });
        }
    } catch (error) {
        results.broken.push({
            name: commandName,
            file: file,
            reason: error.message,
            error: error.code || 'UNKNOWN'
        });
    }
});

// Print results
console.log('═══════════════════════════════════════════════════════════');
console.log(`📊 TOTAL COMMANDS: ${results.total}`);
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`✅ WORKING COMMANDS: ${results.working.length}`);
console.log('───────────────────────────────────────────────────────────');
results.working.forEach(cmd => {
    console.log(`  ✓ ${cmd.name.padEnd(25)} | ${cmd.type.padEnd(25)} | ${(cmd.size / 1024).toFixed(2)} KB`);
});

console.log(`\n❌ BROKEN COMMANDS: ${results.broken.length}`);
console.log('───────────────────────────────────────────────────────────');
results.broken.forEach(cmd => {
    console.log(`  ✗ ${cmd.name.padEnd(25)} | ${cmd.reason}`);
});

console.log(`\n⏸️  DISABLED COMMANDS: ${results.disabled.length}`);
console.log('───────────────────────────────────────────────────────────');
results.disabled.forEach(cmd => {
    console.log(`  ⊗ ${cmd.name.padEnd(25)} | ${cmd.reason}`);
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('📝 SUMMARY:');
console.log(`   Working:  ${results.working.length}/${results.total} (${((results.working.length / results.total) * 100).toFixed(1)}%)`);
console.log(`   Broken:   ${results.broken.length}/${results.total} (${((results.broken.length / results.total) * 100).toFixed(1)}%)`);
console.log(`   Disabled: ${results.disabled.length}/${results.total} (${((results.disabled.length / results.total) * 100).toFixed(1)}%)`);
console.log('═══════════════════════════════════════════════════════════\n');

// Save detailed report
const reportPath = path.join(__dirname, 'command-scan-report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`📄 Detailed report saved to: ${reportPath}\n`);
