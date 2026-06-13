import os

translations = {
    'en.js': {
        'codex_locked_placeholder': 'Detailed system information will be available here once unlocked.'
    },
    'es.js': {
        'codex_locked_placeholder': 'La información detallada del sistema estará disponible aquí una vez desbloqueado.'
    },
    'ca.js': {
        'codex_locked_placeholder': 'La informació detallada del sistema estarà disponible aquí un cop desbloquejat.'
    },
    'eu.js': {
        'codex_locked_placeholder': 'Sistemaren informazio zehatza hemen egongo da eskuragarri desblokeatutakoan.'
    },
    'gl.js': {
        'codex_locked_placeholder': 'A información detallada do sistema estará dispoñible aquí unha vez desbloqueado.'
    }
}

base_path = '/home/dsibars/development/rpg-village-project/js/engine/shared/core/i18n/translations'

for filename, trans_dict in translations.items():
    file_path = os.path.join(base_path, filename)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content_stripped = content.rstrip()
        if content_stripped.endswith('};'):
            base_content = content_stripped[:-2]
            lines_to_add = []
            for key, val in trans_dict.items():
                escaped_val = val.replace("'", "\\'").replace("\n", "\\n")
                lines_to_add.append(f"    {key}: '{escaped_val}',")
            new_lines = "\n" + "\n".join(lines_to_add) + "\n};"
            new_content = base_content + new_lines
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully added placeholders to {filename}")
        else:
            print(f"File {filename} does not end with '}};'")
