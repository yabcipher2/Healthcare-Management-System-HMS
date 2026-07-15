import re

def add_audit_to_page(filename, audit_tab, icon_name='ShieldAlert'):
    with open(f'frontend/src/pages/{filename}', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add useCallback to React import
    if 'useCallback' not in content:
        content = content.replace(
            'import React, { useState, useEffect } from "react";',
            'import React, { useState, useEffect, useCallback } from "react";'
        )
    
    # 2. Add audit icons
    audit_icons = ['ShieldAlert', 'Plus', 'X', 'FileText', 'Activity', 'LogOut', 'ClipboardList']
    lucide_match = re.search(r'import \{([^}]+)\} from "lucide-react";', content)
    if lucide_match:
        existing_icons = [i.strip() for i in lucide_match.group(1).split(',')]
        missing_icons = [i for i in audit_icons if i not in existing_icons]
        if missing_icons:
            old_import = lucide_match.group(0)
            new_import = old_import.replace('} from "lucide-react";', ', ' + ', '.join(missing_icons) + '} from "lucide-react";')
            content = content.replace(old_import, new_import)
    
    # 3. Add audit import
    if 'fetchAuditAlertsCount' not in content:
        content = content.replace(
            'import { StatusBanner } from "../components/StatusBanner";',
            'import { StatusBanner } from "../components/StatusBanner";\nimport { logAudit, fetchAuditLogs, fetchAuditAlertsCount } from "../utils/audit";'
        )
    
    state_block = '''
  const [auditAlertsCount, setAuditAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState("");

  const loadAuditAlertsCount = useCallback(async () => {
    try {
      const data = await fetchAuditAlertsCount();
      setAuditAlertsCount(data);
    } catch {
      // Silently fail audit count fetch - non-critical
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    setAuditLogsError("");
    try {
      const result = await fetchAuditLogs({ page: 1, limit: 20 });
      setAuditLogs(result.data || []);
    } catch (err) {
      setAuditLogsError(err.message || "Failed to load audit logs");
    } finally {
      setAuditLogsLoading(false);
    }
  }, []);
'''
    
    # 4. Add audit state
    if 'auditAlertsCount' not in content:
        insert_patterns = [
            r'const \[doctorLoading, setDoctorLoading\] = useState\(true\);',
            r'const \[loading, setLoading\] = useState\(true\);',
            r'const \[selectedPatient, setSelectedPatient\] = useState\(null\);',
        ]
        for pattern in insert_patterns:
            match = re.search(pattern, content)
            if match:
                insert_point = match.end()
                content = content[:insert_point] + state_block + content[insert_point:]
                break
    
    effects_block = '''
  useEffect(() => {
    loadAuditAlertsCount();
    loadAuditLogs();
  }, [loadAuditAlertsCount, loadAuditLogs]);

  useEffect(() => {
    const interval = setInterval(() => loadAuditAlertsCount(), 30000);
    return () => clearInterval(interval);
  }, [loadAuditAlertsCount]);
'''
    
    # 5. Add audit effects
    if 'setInterval(() => loadAuditAlertsCount()' not in content:
        pattern = r'(const loadAuditLogs = useCallback\(async \(\) => \{[\s\S]*?^\s{2}\}, \[\]\);)\n'
        match = re.search(pattern, content, re.MULTILINE)
        if match:
            content = content[:match.end()] + effects_block + content[match.end():]
    
    # 6. Add sidebar audit button
    if f'setActiveTab("{audit_tab}")' not in content:
        logout_patterns = [
            r'<button\s+onClick=\{onLogout\}\s+className="[^"]+"\s+>\s*<LogOut[^>]+>\s*[^<]+</button>',
            r'<button\s+onClick=\{\(\) => \{[^}]+\}\s+className="[^"]+"\s+>\s*<LogOut[^>]+>\s*[^<]+</button>',
        ]
        for pattern in logout_patterns:
            match = re.search(pattern, content)
            if match:
                audit_btn = '<button\n          onClick={() => {\n            setActiveTab("' + audit_tab + '");\n            loadAuditLogs();\n          }}\n          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-bold uppercase tracking-wider rounded-xl transition"\n        >\n          <' + icon_name + ' size={14} /> Audit Activity ({auditAlertsCount})\n        </button>\n'
                content = content[:match.start()] + audit_btn + content[match.start():]
                break
    
    # 7. Add main content section
    if f'activeTab === "{audit_tab}"' not in content:
        closing_pattern = r'</main>\s*</div>\s*</div>\s*\);\s*\}'
        match = re.search(closing_pattern, content, re.DOTALL)
        if match:
            audit_section = '        </main>\n\n        {activeTab === "' + audit_tab + '" && (\n          <div className="space-y-6 animate-fadeIn">\n            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">\n              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">\n                <div>\n                  <h1 className="text-2xl font-black text-slate-900">Department Audit Logs</h1>\n                  <p className="text-slate-400 font-medium mt-1">Your recent activity and department changes</p>\n                </div>\n                <span className="text-xs font-mono font-bold bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg uppercase">My Department</span>\n              </div>\n              {auditLogsError && (\n                <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">{auditLogsError}</div>\n              )}\n              {auditLogsLoading ? (\n                <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Loading audit logs...</div>\n              ) : auditLogs.length === 0 ? (\n                <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-wider">No audit logs found for your department</div>\n              ) : (\n                <div className="divide-y divide-slate-100">\n                  {auditLogs.map((log) => (\n                    <div key={log._id || log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition">\n                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">\n                        {log.action === "CREATE" && <Plus size={18} />}\n                        {log.action === "UPDATE" && <FileText size={18} />}\n                        {log.action === "DELETE" && <X size={18} />}\n                        {["ACTIVATE","DEACTIVATE","RESTORE","ARCHIVE"].includes(log.action) && <Activity size={18} />}\n                        {log.action === "LOGIN" && <LogOut size={18} />}\n                        {!["CREATE","UPDATE","DELETE","ACTIVATE","DEACTIVATE","RESTORE","ARCHIVE","LOGIN"].includes(log.action) && <ClipboardList size={18} />}\n                      </div>\n                      <div className="flex-1 min-w-0">\n                        <div className="flex items-center gap-2 flex-wrap">\n                          <span className="text-xs font-black text-slate-900 uppercase">{log.module}</span>\n                          <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{log.action}</span>\n                        </div>\n                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.details}</p>\n                        <p className="text-[10px] text-slate-400 mt-1.5 font-mono">{log.userName} • {log.userRole} • {log.department} • {new Date(log.createdAt).toLocaleString()}</p>\n                      </div>\n                    </div>\n                  ))}\n                </div>\n              )}\n            </div>\n          </div>\n        )}\n'
            content = content[:match.start()] + audit_section + content[match.start():]
    
    with open(f'frontend/src/pages/{filename}', 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'{filename}: DONE')

# Process all pages
pages = [
    ('DoctorPage.jsx', 'doctorAudit'),
    ('NursePage.jsx', 'nurseAudit'),
    ('PharmacyPage.jsx', 'pharmacyAudit'),
    ('LaboratoryPage.jsx', 'labAudit'),
    ('TriagePage.jsx', 'triageAudit'),
    ('ReceptionPage.jsx', 'receptionAudit'),
    ('WardPage.jsx', 'wardAudit'),
]

for filename, tab in pages:
    try:
        add_audit_to_page(filename, tab)
    except Exception as e:
        print(f'{filename}: ERROR - {e}')
        import traceback
        traceback.print_exc()
