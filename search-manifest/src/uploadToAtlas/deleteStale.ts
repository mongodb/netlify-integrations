export const deleteStaleDocuments = async (
  searchProperty: string,
  manifestRevisionId: string
) => {
  console.debug(`Removing old documents`);
  return {
    filter: {
      searchProperty: searchProperty,
      manifestRevisionId: { $ne: manifestRevisionId },
    },
  };
  //   const deleteResult = await collection.deleteMany(
  //     {
  //       searchProperty: searchProperty,
  //       manifestRevisionId: { $ne: manifestRevisionId },
  //     },
  //     { session }
  //   );
  //   status.deleted +=
  //     deleteResult.deletedCount === undefined ? 0 : deleteResult.deletedCount;
  //   console.debug(
  //     `Removed ${deleteResult.deletedCount} entries from ${collection.collectionName}`
  //   );
};

export const deleteStaleProperties = async (searchProperty: string) => {
  console.debug(`Removing old documents`);
  return {
    searchProperty: { $regex: searchProperty },
  };
};
