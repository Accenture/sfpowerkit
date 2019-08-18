import ProfileRetriever from "../../metadata/retriever/profileRetriever";
import xml2js = require("xml2js");
import util = require("util");
import Profile from "../../metadata/schema";
import _ from "lodash";
import DiffUtil from "../../project/diff/diffutils";

export default abstract class ProfileDiff {
  public static async generateProfileXml(
    profileXml1: string,
    profileXml2: string,
    outputFilePath: string
  ) {
    const parser = new xml2js.Parser({ explicitArray: true });
    const parseString = util.promisify(parser.parseString);

    let parseResult = await parseString(profileXml1);
    let profileObj1 = ProfileRetriever.toProfile(parseResult.Profile);
    parseResult = await parseString(profileXml2);
    let profileObj2 = ProfileRetriever.toProfile(parseResult.Profile);

    let newProObj = {
      fullName: profileObj2.fullName,
      applicationVisibilities: [],
      classAccesses: [],
      customPermissions: [],
      externalDataSourceAccesses: [],
      fieldLevelSecurities: [],
      fieldPermissions: [],
      layoutAssignments: [],
      loginHours: [],
      loginIpRanges: [],
      objectPermissions: [],
      pageAccesses: [],
      profileActionOverrides: [],
      recordTypeVisibilities: [],
      tabVisibilities: [],
      userPermissions: []
    } as Profile;

    if (!_.isNil(profileObj2.description)) {
      newProObj.description = profileObj2.description;
    }

    newProObj.applicationVisibilities = DiffUtil.getChangedOrAdded(
      profileObj1.applicationVisibilities,
      profileObj2.applicationVisibilities,
      "application"
    ).addedEdited;
    newProObj.classAccesses = DiffUtil.getChangedOrAdded(
      profileObj1.classAccesses,
      profileObj2.classAccesses,
      "apexClass"
    ).addedEdited;
    newProObj.customPermissions = DiffUtil.getChangedOrAdded(
      profileObj1.customPermissions,
      profileObj2.customPermissions,
      "name"
    ).addedEdited;
    newProObj.externalDataSourceAccesses = DiffUtil.getChangedOrAdded(
      profileObj1.externalDataSourceAccesses,
      profileObj2.externalDataSourceAccesses,
      "externalDataSource"
    ).addedEdited;
    newProObj.fieldLevelSecurities = DiffUtil.getChangedOrAdded(
      profileObj1.fieldLevelSecurities,
      profileObj2.fieldLevelSecurities,
      "field"
    ).addedEdited;
    newProObj.fieldPermissions = DiffUtil.getChangedOrAdded(
      profileObj1.fieldPermissions,
      profileObj2.fieldPermissions,
      "field"
    ).addedEdited;
    newProObj.loginHours = !_.isEqual(
      profileObj1.loginHours,
      profileObj2.loginHours
    )
      ? profileObj2.loginHours
      : [];
    newProObj.loginIpRanges = !_.isEqual(
      profileObj1.loginIpRanges,
      profileObj2.loginIpRanges
    )
      ? profileObj2.loginIpRanges
      : [];

    newProObj.objectPermissions = DiffUtil.getChangedOrAdded(
      profileObj1.objectPermissions,
      profileObj2.objectPermissions,
      "object"
    ).addedEdited;
    newProObj.pageAccesses = DiffUtil.getChangedOrAdded(
      profileObj1.pageAccesses,
      profileObj2.pageAccesses,
      "apexPage"
    ).addedEdited;
    newProObj.profileActionOverrides = DiffUtil.getChangedOrAdded(
      profileObj1.profileActionOverrides,
      profileObj2.profileActionOverrides,
      "actionName"
    ).addedEdited;
    newProObj.recordTypeVisibilities = DiffUtil.getChangedOrAdded(
      profileObj1.recordTypeVisibilities,
      profileObj2.recordTypeVisibilities,
      "recordType"
    ).addedEdited;
    newProObj.tabVisibilities = DiffUtil.getChangedOrAdded(
      profileObj1.tabVisibilities,
      profileObj2.tabVisibilities,
      "tab"
    ).addedEdited;
    newProObj.userPermissions = DiffUtil.getChangedOrAdded(
      profileObj1.userPermissions,
      profileObj2.userPermissions,
      "name"
    ).addedEdited;

    newProObj.layoutAssignments = this.getChangedOrAddedLayouts(
      profileObj1.layoutAssignments,
      profileObj2.layoutAssignments
    );

    await ProfileRetriever.writeProfile(newProObj, outputFilePath);
  }
  private static getChangedOrAddedLayouts(list1: any[], list2: any[]) {
    let result: any[] = [];
    if (_.isNil(list1) && !_.isNil(list2) && list2.length > 0) {
      result.push(...list2);
    }
    if (!_.isNil(list1) && !_.isNil(list2)) {
      list2.forEach(layoutAss2 => {
        let found = false;
        for (let i = 0; i < list1.length; i++) {
          let layoutAss1 = list1[i];
          if (layoutAss1.layout === layoutAss2.layout) {
            //check if edited
            if (_.isEqual(layoutAss1, layoutAss2)) {
              found = true;
              break;
            }
          }
        }
        if (!found) {
          result.push(layoutAss2);
        }
      });
    }
    return result;
  }
}