from pathlib import Path

path = Path('src/admin/AdminApp.jsx')
text = path.read_text()

import_anchor = "import { cmsRequest, getAdminSession, loginAdmin, logoutAdmin } from './api'\n"
import_line = "import ProviderMappingPage from './ProviderMappingPage'\n"
if import_line not in text:
    if import_anchor not in text:
        raise SystemExit('Admin import anchor not found')
    text = text.replace(import_anchor, import_anchor + import_line, 1)

nav_anchor = "  ['catalog', 'Catalog', '▦'],\n  ['promotions', 'Promotions', '⚡'],"
nav_replacement = "  ['catalog', 'Catalog', '▦'],\n  ['provider-mapping', 'Provider Mapping', '⇄'],\n  ['promotions', 'Promotions', '⚡'],"
if "['provider-mapping', 'Provider Mapping'" not in text:
    if nav_anchor not in text:
        raise SystemExit('Admin NAV anchor not found')
    text = text.replace(nav_anchor, nav_replacement, 1)

page_anchor = "    catalog: <CatalogPage />,\n    promotions: <PromotionsPage />,"
page_replacement = "    catalog: <CatalogPage />,\n    'provider-mapping': <ProviderMappingPage />,\n    promotions: <PromotionsPage />,"
if "'provider-mapping': <ProviderMappingPage />" not in text:
    if page_anchor not in text:
        raise SystemExit('Admin page map anchor not found')
    text = text.replace(page_anchor, page_replacement, 1)

path.write_text(text)
print('Provider Mapping admin route patched')
