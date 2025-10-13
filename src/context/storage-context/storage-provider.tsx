import React, { useCallback, useMemo } from 'react';
import type { StorageContext } from './storage-context';
import { storageContext } from './storage-context';
import Dexie, { type EntityTable } from 'dexie';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import { determineCardinalities } from '@/lib/domain/db-relationship';
import type { ChartDBConfig } from '@/lib/domain/config';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import apiStorage from './api'; // Import API implementation

const useApi = true //import.meta.env.VITE_USE_API === 'true';

export const StorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const db = useMemo(() => {
        const dexieDB = new Dexie('ChartDB') as Dexie & {
            diagrams: EntityTable<
                Diagram,
                'id' // primary key "id" (for the typings only)
            >;
            db_tables: EntityTable<
                DBTable & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            db_relationships: EntityTable<
                DBRelationship & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            db_dependencies: EntityTable<
                DBDependency & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            areas: EntityTable<
                Area & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            db_custom_types: EntityTable<
                DBCustomType & { diagramId: string },
                'id' // primary key "id" (for the typings only)
            >;
            config: EntityTable<
                ChartDBConfig & { id: number },
                'id' // primary key "id" (for the typings only)
            >;
            diagram_filters: EntityTable<
                DiagramFilter & { diagramId: string },
                'diagramId' // primary key "id" (for the typings only)
            >;
        };

        // Schema declaration:
        dexieDB.version(1).stores({
            diagrams: '++id, name, databaseType, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, x, y, fields, indexes, color, createdAt, width',
            db_relationships:
                '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(2).upgrade((tx) =>
            tx
                .table<DBTable & { diagramId: string }>('db_tables')
                .toCollection()
                .modify((table) => {
                    for (const field of table.fields) {
                        field.type = {
                            // @ts-expect-error string before
                            id: (field.type as string).split(' ').join('_'),
                            // @ts-expect-error string before
                            name: field.type,
                        };
                    }
                })
        );

        dexieDB.version(3).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, x, y, fields, indexes, color, createdAt, width',
            db_relationships:
                '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(4).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, x, y, fields, indexes, color, createdAt, width, comment',
            db_relationships:
                '++id, diagramId, name, sourceTableId, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(5).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(6).upgrade((tx) =>
            tx
                .table<DBRelationship & { diagramId: string }>(
                    'db_relationships'
                )
                .toCollection()
                .modify((relationship, ref) => {
                    const { sourceCardinality, targetCardinality } =
                        determineCardinalities(
                            // @ts-expect-error string before
                            relationship.type ?? 'one_to_one'
                        );

                    relationship.sourceCardinality = sourceCardinality;
                    relationship.targetCardinality = targetCardinality;

                    // @ts-expect-error string before
                    delete ref.value.type;
                })
        );

        dexieDB.version(7).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            db_dependencies:
                '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(8).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment, isView, isMaterializedView, order',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            db_dependencies:
                '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(9).upgrade((tx) =>
            tx
                .table<DBTable & { diagramId: string }>('db_tables')
                .toCollection()
                .modify((table) => {
                    for (const field of table.fields) {
                        if (typeof field.nullable === 'string') {
                            field.nullable =
                                (field.nullable as string).toLowerCase() ===
                                'true';
                        }
                    }
                })
        );

        dexieDB.version(10).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment, isView, isMaterializedView, order',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            db_dependencies:
                '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
            areas: '++id, diagramId, name, x, y, width, height, color',
            config: '++id, defaultDiagramId',
        });

        dexieDB.version(11).stores({
            diagrams:
                '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
            db_tables:
                '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment, isView, isMaterializedView, order',
            db_relationships:
                '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
            db_dependencies:
                '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
            areas: '++id, diagramId, name, x, y, width, height, color',
            db_custom_types:
                '++id, diagramId, schema, type, kind, values, fields',
            config: '++id, defaultDiagramId',
        });

        dexieDB
            .version(12)
            .stores({
                diagrams:
                    '++id, name, databaseType, databaseEdition, createdAt, updatedAt',
                db_tables:
                    '++id, diagramId, name, schema, x, y, fields, indexes, color, createdAt, width, comment, isView, isMaterializedView, order',
                db_relationships:
                    '++id, diagramId, name, sourceSchema, sourceTableId, targetSchema, targetTableId, sourceFieldId, targetFieldId, type, createdAt',
                db_dependencies:
                    '++id, diagramId, schema, tableId, dependentSchema, dependentTableId, createdAt',
                areas: '++id, diagramId, name, x, y, width, height, color',
                db_custom_types:
                    '++id, diagramId, schema, type, kind, values, fields',
                config: '++id, defaultDiagramId',
                diagram_filters: 'diagramId, tableIds, schemasIds',
            })
            .upgrade((tx) => {
                tx.table('config').clear();
            });

        dexieDB.on('ready', async () => {
            const config = await dexieDB.config.get(1);

            if (!config) {
                const diagrams = await dexieDB.diagrams.toArray();

                await dexieDB.config.add({
                    id: 1,
                    defaultDiagramId: diagrams?.[0]?.id ?? '',
                });
            }
        });
        return dexieDB;
    }, []);

  const dexieImpl: StorageContext = {
    getConfig: useCallback(async () => await db.config.get(1), [db]),
    updateConfig: useCallback(async (config) => {
      await db.config.update(1, config);
    }, [db]),
    getDiagramFilter: useCallback(async (diagramId: string) => {
      return await db.diagram_filters.get({ diagramId });
    }, [db]),
    updateDiagramFilter: useCallback(async (diagramId, filter) => {
      await db.diagram_filters.put({ diagramId, ...filter });
    }, [db]),
    deleteDiagramFilter: useCallback(async (diagramId: string) => {
      await db.diagram_filters.where({ diagramId }).delete();
    }, [db]),
    addTable: useCallback(async ({ diagramId, table }) => {
      await db.db_tables.add({ ...table, diagramId });
    }, [db]),
    getTable: useCallback(async ({ id, diagramId }) => {
      return await db.db_tables.get({ id, diagramId });
    }, [db]),
    deleteDiagramTables: useCallback(async (diagramId) => {
      await db.db_tables.where('diagramId').equals(diagramId).delete();
    }, [db]),
    updateTable: useCallback(async ({ id, attributes }) => {
      await db.db_tables.update(id, attributes);
    }, [db]),
    putTable: useCallback(async ({ diagramId, table }) => {
      await db.db_tables.put({ ...table, diagramId });
    }, [db]),
    deleteTable: useCallback(async ({ id, diagramId }) => {
      await db.db_tables.where({ id, diagramId }).delete();
    }, [db]),
    listTables: useCallback(async (diagramId) => {
      return await db.db_tables.where('diagramId').equals(diagramId).toArray();
    }, [db]),
    addRelationship: useCallback(async ({ diagramId, relationship }) => {
      await db.db_relationships.add({ ...relationship, diagramId });
    }, [db]),
    deleteDiagramRelationships: useCallback(async (diagramId) => {
      await db.db_relationships.where('diagramId').equals(diagramId).delete();
    }, [db]),
    getRelationship: useCallback(async ({ id, diagramId }) => {
      return await db.db_relationships.get({ id, diagramId });
    }, [db]),
    updateRelationship: useCallback(async ({ id, attributes }) => {
      await db.db_relationships.update(id, attributes);
    }, [db]),
    deleteRelationship: useCallback(async ({ id, diagramId }) => {
      await db.db_relationships.where({ id, diagramId }).delete();
    }, [db]),
    listRelationships: useCallback(async (diagramId) => {
      return (await db.db_relationships.where('diagramId').equals(diagramId).toArray()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }, [db]),
    addDependency: useCallback(async ({ diagramId, dependency }) => {
      await db.db_dependencies.add({ ...dependency, diagramId });
    }, [db]),
    getDependency: useCallback(async ({ diagramId, id }) => {
      return await db.db_dependencies.get({ id, diagramId });
    }, [db]),
    updateDependency: useCallback(async ({ id, attributes }) => {
      await db.db_dependencies.update(id, attributes);
    }, [db]),
    deleteDependency: useCallback(async ({ diagramId, id }) => {
      await db.db_dependencies.where({ id, diagramId }).delete();
    }, [db]),
    listDependencies: useCallback(async (diagramId) => {
      return await db.db_dependencies.where('diagramId').equals(diagramId).toArray();
    }, [db]),
    deleteDiagramDependencies: useCallback(async (diagramId) => {
      await db.db_dependencies.where('diagramId').equals(diagramId).delete();
    }, [db]),
    addArea: useCallback(async ({ area, diagramId }) => {
      await db.areas.add({ ...area, diagramId });
    }, [db]),
    getArea: useCallback(async ({ diagramId, id }) => {
      return await db.areas.get({ id, diagramId });
    }, [db]),
    updateArea: useCallback(async ({ id, attributes }) => {
      await db.areas.update(id, attributes);
    }, [db]),
    deleteArea: useCallback(async ({ diagramId, id }) => {
      await db.areas.where({ id, diagramId }).delete();
    }, [db]),
    listAreas: useCallback(async (diagramId) => {
      return await db.areas.where('diagramId').equals(diagramId).toArray();
    }, [db]),
    deleteDiagramAreas: useCallback(async (diagramId) => {
      await db.areas.where('diagramId').equals(diagramId).delete();
    }, [db]),
    addCustomType: useCallback(async ({ diagramId, customType }) => {
      await db.db_custom_types.add({ ...customType, diagramId });
    }, [db]),
    getCustomType: useCallback(async ({ diagramId, id }) => {
      return await db.db_custom_types.get({ id, diagramId });
    }, [db]),
    updateCustomType: useCallback(async ({ id, attributes }) => {
      await db.db_custom_types.update(id, attributes);
    }, [db]),
    deleteCustomType: useCallback(async ({ diagramId, id }) => {
      await db.db_custom_types.where({ id, diagramId }).delete();
    }, [db]),
    listCustomTypes: useCallback(async (diagramId) => {
      return (await db.db_custom_types.where('diagramId').equals(diagramId).toArray()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }, [db]),
    deleteDiagramCustomTypes: useCallback(async (diagramId) => {
      await db.db_custom_types.where('diagramId').equals(diagramId).delete();
    }, [db]),
    addDiagram: useCallback(
      async ({ diagram }) => {
        const promises = [];
        promises.push(
          db.diagrams.add({
            id: diagram.id,
            name: diagram.name,
            databaseType: diagram.databaseType,
            databaseEdition: diagram.databaseEdition,
            createdAt: diagram.createdAt,
            updatedAt: diagram.updatedAt,
          })
        );
        const tables = diagram.tables ?? [];
        promises.push(...tables.map((table) => db.db_tables.add({ ...table, diagramId: diagram.id })));
        const relationships = diagram.relationships ?? [];
        promises.push(
          ...relationships.map((relationship) => db.db_relationships.add({ ...relationship, diagramId: diagram.id }))
        );
        const dependencies = diagram.dependencies ?? [];
        promises.push(
          ...dependencies.map((dependency) => db.db_dependencies.add({ ...dependency, diagramId: diagram.id }))
        );
        const areas = diagram.areas ?? [];
        promises.push(...areas.map((area) => db.areas.add({ ...area, diagramId: diagram.id })));
        const customTypes = diagram.customTypes ?? [];
        promises.push(
          ...customTypes.map((customType) => db.db_custom_types.add({ ...customType, diagramId: diagram.id }))
        );
        await Promise.all(promises);
      },
      [db]
    ),
    listDiagrams: useCallback(
      async (options = { includeRelationships: false, includeTables: false, includeDependencies: false, includeAreas: false, includeCustomTypes: false }) => {
        let diagrams = await db.diagrams.toArray();
        if (options.includeTables) {
          diagrams = await Promise.all(
            diagrams.map(async (diagram) => {
              diagram.tables = await db.db_tables.where('diagramId').equals(diagram.id).toArray();
              return diagram;
            })
          );
        }
        if (options.includeRelationships) {
          diagrams = await Promise.all(
            diagrams.map(async (diagram) => {
              diagram.relationships = await db.db_relationships.where('diagramId').equals(diagram.id).toArray();
              return diagram;
            })
          );
        }
        if (options.includeDependencies) {
          diagrams = await Promise.all(
            diagrams.map(async (diagram) => {
              diagram.dependencies = await db.db_dependencies.where('diagramId').equals(diagram.id).toArray();
              return diagram;
            })
          );
        }
        if (options.includeAreas) {
          diagrams = await Promise.all(
            diagrams.map(async (diagram) => {
              diagram.areas = await db.areas.where('diagramId').equals(diagram.id).toArray();
              return diagram;
            })
          );
        }
        if (options.includeCustomTypes) {
          diagrams = await Promise.all(
            diagrams.map(async (diagram) => {
              diagram.customTypes = await db.db_custom_types.where('diagramId').equals(diagram.id).toArray();
              return diagram;
            })
          );
        }
        return diagrams;
      },
      [db]
    ),
    getDiagram: useCallback(
      async (id, options = { includeRelationships: false, includeTables: false, includeDependencies: false, includeAreas: false, includeCustomTypes: false }) => {
        const diagram = await db.diagrams.get(id);
        if (!diagram) {
          return undefined;
        }
        if (options.includeTables) {
          diagram.tables = await db.db_tables.where('diagramId').equals(id).toArray();
        }
        if (options.includeRelationships) {
          diagram.relationships = await db.db_relationships.where('diagramId').equals(id).toArray();
        }
        if (options.includeDependencies) {
          diagram.dependencies = await db.db_dependencies.where('diagramId').equals(id).toArray();
        }
        if (options.includeAreas) {
          diagram.areas = await db.areas.where('diagramId').equals(id).toArray();
        }
        if (options.includeCustomTypes) {
          diagram.customTypes = await db.db_custom_types.where('diagramId').equals(id).toArray();
        }
        return diagram;
      },
      [db]
    ),
    updateDiagram: useCallback(
      async ({ id, attributes }) => {
        await db.diagrams.update(id, attributes);
        if (attributes.id) {
          await Promise.all([
            db.db_tables.where('diagramId').equals(id).modify({ diagramId: attributes.id }),
            db.db_relationships.where('diagramId').equals(id).modify({ diagramId: attributes.id }),
            db.db_dependencies.where('diagramId').equals(id).modify({ diagramId: attributes.id }),
            db.areas.where('diagramId').equals(id).modify({ diagramId: attributes.id }),
            db.db_custom_types.where('diagramId').equals(id).modify({ diagramId: attributes.id }),
          ]);
        }
      },
      [db]
    ),
    deleteDiagram: useCallback(
      async (id) => {
        await Promise.all([
          db.diagrams.delete(id),
          db.db_tables.where('diagramId').equals(id).delete(),
          db.db_relationships.where('diagramId').equals(id).delete(),
          db.db_dependencies.where('diagramId').equals(id).delete(),
          db.areas.where('diagramId').equals(id).delete(),
          db.db_custom_types.where('diagramId').equals(id).delete(),
        ]);
      },
      [db]
    ),
  };
const storageImpl: StorageContext = useApi ? apiStorage : dexieImpl;

  // Handle config initialization for API (mimic Dexie on('ready'))
  if (useApi) {
    storageImpl.getConfig().then(async (config) => {
      if (!config) {
        const diagrams = await storageImpl.listDiagrams();
        console.log(diagrams)
        await storageImpl.updateConfig({ defaultDiagramId: diagrams?.[0]?.id ?? '' });
      }
    });
  }

  return <storageContext.Provider value={storageImpl}>{children}</storageContext.Provider>;

    // return (
    //     <storageContext.Provider
    //         value={{
    //             getConfig,
    //             updateConfig,
    //             addDiagram,
    //             listDiagrams,
    //             getDiagram,
    //             updateDiagram,
    //             deleteDiagram,
    //             addTable,
    //             getTable,
    //             updateTable,
    //             putTable,
    //             deleteTable,
    //             listTables,
    //             addRelationship,
    //             getRelationship,
    //             updateRelationship,
    //             deleteRelationship,
    //             listRelationships,
    //             deleteDiagramTables,
    //             deleteDiagramRelationships,
    //             addDependency,
    //             getDependency,
    //             updateDependency,
    //             deleteDependency,
    //             listDependencies,
    //             deleteDiagramDependencies,
    //             addArea,
    //             getArea,
    //             updateArea,
    //             deleteArea,
    //             listAreas,
    //             deleteDiagramAreas,
    //             addCustomType,
    //             getCustomType,
    //             updateCustomType,
    //             deleteCustomType,
    //             listCustomTypes,
    //             deleteDiagramCustomTypes,
    //             getDiagramFilter,
    //             updateDiagramFilter,
    //             deleteDiagramFilter,
    //         }}
    //     >
    //         {children}
    //     </storageContext.Provider>
    //);
};
