#!/bin/bash
# Разносит общие файлы из _shared/ в каждый кейс.
# Запускать после любой правки в _shared/.
#
#   ./sync.sh
#
# Зачем: папка кейса должна быть самодостаточной, чтобы её можно
# было закинуть на Netlify как есть. Поэтому общий код не
# подключается через ../_shared/, а копируется внутрь.

cd "$(dirname "$0")" || exit 1

# Кейсы, которые уже перешли на общую базу.
# Добавляй сюда папку, когда переводишь очередной кейс.
CASES="pilates-studio language-school aesthetic-clinic buildpro real-estate interior-studio"

for c in $CASES; do
  if [ ! -d "$c" ]; then
    echo "  пропуск: папки $c нет"
    continue
  fi
  mkdir -p "$c/shared"
  cp -R _shared/* "$c/shared/"
  echo "  обновлено: $c/shared/"
done

echo "готово"
