/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
function CloverReport(opts) {
    this.cw = null;
    this.xml = null;
    this.projectRoot = opts.projectRoot || process.cwd();
    this.file = opts.file || 'clover.xml';
}

function asJavaPackage(node) {
    return node.getRelativeName().
        replace(/\//g, '.').
        replace(/\\/g, '.').
        replace(/\.$/, '');
}

function asClassName(node) {
    return node.getRelativeName().replace(/.*[\\\/]/, '');
}

CloverReport.prototype.onStart = function (root, context) {
    this.cw = context.writer.writeFile(this.file);
    this.xml = context.getXMLWriter(this.cw);
    this.writeRootStats(root, context);
};

CloverReport.prototype.onEnd = function () {
    this.xml.closeAll();
    this.cw.close();
};

CloverReport.prototype.getTreeStats = function (node, context) {

    var state = {
            packages: 0,
            files: 0,
            classes: 0,
        },
        visitor = {
            onSummary: function (node, state) {
                var metrics = node.getCoverageSummary(true);
                if (metrics) {
                    state.packages += 1;
                }
            },
            onDetail: function (node, state) {
                state.classes += 1;
                state.files += 1;
            }
        };
    node.visit(context.getVisitor(visitor), state);
    return state;
};

CloverReport.prototype.writeRootStats = function (node, context) {
    var nowTimestamp = +Date.now();

    this.cw.println('<?xml version="1.0" encoding="UTF-8"?>');
    this.xml.openTag('coverage', {
        generated: nowTimestamp,
        clover: '3.2.0'
    });

    this.xml.openTag('project', {
        timestamp: nowTimestamp,
        name: 'All files',
    });

    var metrics = node.getCoverageSummary();
    var attrs = {
        statements: metrics.statements.total,
        coveredstatements: metrics.statements.covered,
        conditionals: metrics.branches.total,
        coveredconditionals: metrics.branches.covered,
        methods: metrics.functions.total,
        coveredmethods: metrics.functions.covered,
        elements: metrics.statements.total + metrics.branches.total + metrics.functions.total,
        coveredelements: metrics.statements.covered + metrics.branches.covered + metrics.functions.covered,
        complexity: 0,
        // 'lines' is derived from 'statements', so it does not contain comments
        ncloc: metrics.lines.total,
        // to be correct here, lines included comments would need to be included
        loc: metrics.lines.total
    };
    var treeStats = this.getTreeStats(node, context);

    Object.keys(treeStats).forEach(function (k) {
        attrs[k] = treeStats[k];
    });

    this.xml.inlineTag('metrics', attrs);
};

CloverReport.prototype.writeMetrics = function (metrics) {
    this.xml.inlineTag('metrics', {
        statements: metrics.statements.total,
        coveredstatements: metrics.statements.covered,
        conditionals: metrics.branches.total,
        coveredconditionals: metrics.branches.covered,
        methods: metrics.functions.total,
        coveredmethods: metrics.functions.covered
    });
};

CloverReport.prototype.onSummary = function (node) {
    if (node.isRoot()) {
        return;
    }
    var metrics = node.getCoverageSummary(true);
    if (!metrics) {
        return;
    }

    this.xml.openTag('package', {
        name: asJavaPackage(node)
    });
    this.writeMetrics(metrics);
};

CloverReport.prototype.onSummaryEnd = function (node) {
    if (node.isRoot()) {
        return;
    }
    this.xml.closeTag('package');
};

CloverReport.prototype.onDetail = function (node) {
    var that = this,
        fileCoverage = node.getFileCoverage(),
        metrics = node.getCoverageSummary(),
        branchByLine = fileCoverage.getBranchCoverageByLine(),
        lines;

    this.xml.openTag('file', {
        name: asClassName(node),
        path: fileCoverage.path
    });

    this.writeMetrics(metrics);

    lines = fileCoverage.getLineCoverage();
    Object.keys(lines).forEach(function (k) {
        var attrs = {
                num: k,
                count: lines[k],
                type: 'stmt'
            },
            branchDetail = branchByLine[k];

        if (branchDetail) {
            attrs.type = 'cond';
            attrs.truecount = branchDetail.covered;
            attrs.falsecount = branchDetail.total - branchDetail.covered;
        }
        that.xml.inlineTag('line', attrs);
    });

    this.xml.closeTag('file');
};

module.exports = CloverReport;
