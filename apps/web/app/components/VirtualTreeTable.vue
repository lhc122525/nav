<template>
  <div ref="containerRef" class="virtual-tree-table" :style="containerStyle">
    <el-table-v2
      ref="tableRef"
      :columns="processedColumns"
      :data="flattenData"
      :row-height="rowHeight"
      :height="tableHeight"
      :width="containerWidth"
      :row-key="rowKey"
      :header-height="showHeader ? 48 : 0"
      fixed
      :class="{ 'hide-header': !showHeader }"
      @scroll="handleScroll"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, watch, h, type VNode, onMounted, onBeforeUnmount } from 'vue'
import type { TableV2Instance } from 'element-plus'

export interface TreeNode {
  id: number | string
  [key: string]: unknown
}

export interface FlattenNode extends TreeNode {
  __level: number
  __expandable: boolean
  __expanded: boolean
  __key: number | string
  __isParent: boolean
}

export interface Column {
  key: string
  dataKey: string
  width: number
  label?: string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right' | boolean
  cellRenderer?: (params: { rowData: FlattenNode; rowIndex: number }) => VNode | string | number
}

interface Props {
  data: TreeNode[]
  columns: Column[]
  rowKey?: string
  height?: number | string
  width?: number | string
  rowHeight?: number
  defaultExpandAll?: boolean
  expandRowKeys?: (number | string)[]
  childrenKey?: string
  showHeader?: boolean
  indentSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  height: 400,
  width: 800,
  rowHeight: 48,
  defaultExpandAll: true,
  expandRowKeys: () => [],
  childrenKey: 'children',
  showHeader: true,
  indentSize: 12
})

const emit = defineEmits<{
  (e: 'update:expandRowKeys', keys: (number | string)[]): void
  (e: 'row-click', row: TreeNode): void
  (e: 'toggle-expand', key: number | string, expanded: boolean): void
}>()

const slots = useSlots()
const tableRef = ref<TableV2Instance>()

const expandedKeys = ref<Set<number | string>>(new Set())

const rowKeyField = computed(() => props.rowKey)

watch(
  () => props.expandRowKeys,
  (newKeys) => {
    expandedKeys.value = new Set(newKeys || [])
  },
  { immediate: true, deep: true }
)

watch(
  () => props.data,
  () => {
    if (props.defaultExpandAll && props.data && props.data.length > 0) {
      const allKeys: (number | string)[] = []
      collectAllKeys(props.data, allKeys)
      expandedKeys.value = new Set(allKeys)
    }
  },
  { immediate: true }
)

function collectAllKeys(nodes: TreeNode[], keys: (number | string)[]) {
  if (!nodes) return
  nodes.forEach((node) => {
    const key = node[rowKeyField.value]
    keys.push(key)
    const children = node[props.childrenKey] as TreeNode[] | undefined
    if (children && children.length > 0) {
      collectAllKeys(children, keys)
    }
  })
}

const flattenData = computed<FlattenNode[]>(() => {
  const result: FlattenNode[] = []
  const expanded = expandedKeys.value
  const childrenKey = props.childrenKey
  const rowKey = rowKeyField.value

  function traverse(nodes: TreeNode[], level: number) {
    if (!nodes || !Array.isArray(nodes)) return

    nodes.forEach((node) => {
      const key = node[rowKey]
      const children = node[childrenKey] as TreeNode[] | undefined
      const hasChildren = !!(children && children.length > 0)
      const isExpanded = expanded.has(key)

      const flatNode = node as FlattenNode
      flatNode.__level = level
      flatNode.__expandable = hasChildren
      flatNode.__expanded = isExpanded
      flatNode.__key = key
      flatNode.__isParent = hasChildren

      result.push(flatNode)

      if (isExpanded && hasChildren) {
        traverse(children, level + 1)
      }
    })
  }

  traverse(props.data, 0)
  return result
})

function getSlotName(key: string): string {
  return `cell-${key}`
}

function isSlotUsed(key: string): boolean {
  return !!slots[getSlotName(key)]
}

const processedColumns = computed(() => {
  const result: Array<Column & { 
    cellRenderer: (params: { rowData: FlattenNode; rowIndex: number }) => VNode
    headerCellRenderer?: () => VNode
  }> = []

  const hasTreeExpandSlot = isSlotUsed('tree-expand')

  if (hasTreeExpandSlot) {
    const treeExpandColumn: Column & { 
      cellRenderer: (params: { rowData: FlattenNode; rowIndex: number }) => VNode
      headerCellRenderer?: () => VNode
    } = {
      key: '__tree-expand__',
      dataKey: '__tree-expand__',
      width: 40,
      align: 'center',
      cellRenderer: ({ rowData }) => {
        const row = rowData as FlattenNode
        const level = row.__level || 0
        const expandable = row.__expandable
        const expanded = row.__expanded
        const isParent = row.__isParent

        const slotContent = slots[getSlotName('tree-expand')]?.({
          row,
          level,
          expandable,
          expanded,
          isParent
        })

        return h('div', {
          class: 'tree-expand-cell',
          style: { paddingLeft: `${level * props.indentSize}px` }
        }, [slotContent])
      },
      headerCellRenderer: () => {
        return h('span', {}, '')
      }
    }
    result.push(treeExpandColumn)
  }

  const columns = props.columns
  const containerW = typeof containerWidth.value === 'number' ? containerWidth.value : 800

  const treeExpandWidth = hasTreeExpandSlot ? 40 : 0

  let totalFixedWidth = treeExpandWidth
  let totalStretchWidth = 0

  const isFixedCol = (col: Column) => col.fixed !== undefined
  const isTreeExpandCol = (col: Column) => col.key === '__tree-expand__'

  columns.forEach((col) => {
    if (isFixedCol(col) || isTreeExpandCol(col)) {
      totalFixedWidth += col.width !== undefined ? col.width : 100
    } else {
      totalStretchWidth += col.width !== undefined ? col.width : 100
    }
  })

  const totalContentWidth = totalFixedWidth + totalStretchWidth
  const extraSpace = containerW - totalContentWidth

  columns.forEach((col) => {
    const slotName = getSlotName(col.key)
    let width: number

    if (isTreeExpandCol(col)) {
      width = 40
    } else if (isFixedCol(col)) {
      width = col.width !== undefined ? col.width : 100
    } else {
      if (extraSpace > 0 && totalStretchWidth > 0) {
        const ratio = col.width! / totalStretchWidth
        width = col.width! + Math.floor(extraSpace * ratio)
      } else {
        width = col.width !== undefined ? col.width : 100
      }
    }

    const columnConfig: typeof col & {
      cellRenderer: (params: { rowData: FlattenNode; rowIndex: number }) => VNode
      headerCellRenderer?: () => VNode
    } = {
      ...col,
      width: Math.floor(width),
      cellRenderer: ({ rowData, rowIndex }: { rowData: FlattenNode; rowIndex: number }) => {
        const row = rowData

        if (slots[slotName]) {
          return h('div', {
            class: 'tree-cell-content',
            style: { width: '100%', display:'flex' }
          }, [slots[slotName]!({
            row,
            rowIndex,
            column: col
          }) as VNode])
        } else {
          return h('div', {
            class: 'tree-cell-content',
            style: { width: '100%',display:'flex' }
          }, [h('span', {}, String(rowData[col.dataKey] ?? ''))])
        }
      }
    }

    if (col.label) {
      columnConfig.headerCellRenderer = () => {
        return h('span', {
          class: 'tree-header-cell'
        }, col.label)
      }
    }

    result.push(columnConfig)
  })

  return result
})

const tableHeight = computed(() => {
  if (typeof props.height === 'number') {
    return props.height
  }
  return parseInt(props.height as string, 10) || 400
})

const containerRef = ref<HTMLDivElement>()
const containerWidth = ref<number | '100%'>(1000)

const containerStyle = computed(() => {
  if (typeof props.height === 'number') {
    return { height: props.height + 'px' }
  }
  return { height: props.height as string }
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
    
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

function toggleExpand(key: number | string) {
  const newSet = new Set(expandedKeys.value)
  const wasExpanded = newSet.has(key)

  if (wasExpanded) {
    newSet.delete(key)
  } else {
    newSet.add(key)
  }

  expandedKeys.value = newSet
  emit('update:expandRowKeys', Array.from(newSet))
  emit('toggle-expand', key, !wasExpanded)
}

function expand(key: number | string) {
  const newSet = new Set(expandedKeys.value)
  newSet.add(key)
  expandedKeys.value = newSet
  emit('update:expandRowKeys', Array.from(newSet))
}

function collapse(key: number | string) {
  const newSet = new Set(expandedKeys.value)
  newSet.delete(key)
  expandedKeys.value = newSet
  emit('update:expandRowKeys', Array.from(newSet))
}

function expandAll() {
  const allKeys: (number | string)[] = []
  collectAllKeys(props.data, allKeys)
  expandedKeys.value = new Set(allKeys)
  emit('update:expandRowKeys', allKeys)
}

function collapseAll() {
  expandedKeys.value = new Set()
  emit('update:expandRowKeys', [])
}

function handleScroll(_params: { scrollTop: number }) {
  // 滚动事件处理
}

defineExpose({
  toggleExpand,
  expand,
  collapse,
  expandAll,
  collapseAll,
  tableRef,
  expandedKeys
})
</script>

<style scoped>
.virtual-tree-table {
  width: 100%;
}

.tree-expand-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.tree-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: #606266;
  cursor: pointer;
  transition: transform 0.3s ease;
  user-select: none;
}

.tree-arrow:hover {
  color: #409eff;
}

.tree-arrow.expanded {
  transform: rotate(90deg);
}

.tree-cell-content {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.tree-header-cell {
  font-weight: 600;
  color: #303133;
}
</style>

<style>
.virtual-tree-table .el-table-v2 {
  --el-table-v2-header-cell-height: 48px;
}

.virtual-tree-table .el-table-v2__header {
  background-color: #f5f7fa;
}

.virtual-tree-table .el-table-v2__header-cell {
  background-color: #f5f7fa !important;
  font-weight: 600;
  color: #303133;
}

.virtual-tree-table .el-table-v2__row {
  cursor: pointer;
}

.virtual-tree-table .el-table-v2__row:hover > .el-table-v2__cell {
  background-color: #f5f7fa;
}

.virtual-tree-table.hide-header .el-table-v2__header {
  display: none;
}
</style>
