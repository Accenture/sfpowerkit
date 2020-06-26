import { SfdxError, Connection } from "@salesforce/core";
import getDefaults from "../../../utils/getDefaults";
import { SFPowerkit, LoggerLevel } from "../../../sfpowerkit";
import { DescribeMetadataResult, FileProperties } from "jsforce";
import { chunkArray } from "../../../utils/chunkArray";
import { ProgressBar } from "../../../ui/progressBar";
import GetDefaults from "../../../utils/getDefaults";
import retry from "async-retry";

export default class MetadataSummaryInfoFetcher {
  private static NotSupportedTypes = [
    "AccountForecastSettings",
    "Icon",
    "GlobalValueSet",
    "StandardValueSet",
    "CustomPermission",
    "EscalationRules",
    "RecordActionDeployment",
    "EscalationRule",
    "ApprovalProcess",
    "SiteDotCom",
    "BrandingSet",
    "NetworkBranding",
    "AuthProvider",
    "ContentAsset",
    "CustomSite",
    "EmbeddedServiceConfig",
    "UIObjectRelationConfig",
    "CareProviderSearchConfig",
    "EmbeddedServiceBranding",
    "EmbeddedServiceFlowConfig",
    "EmbeddedServiceMenuSettings",
    "SalesAgreementSettings",
    "ActionLinkGroupTemplate",
    "TransactionSecurityPolicy",
    "SynonymDictionary",
    "RecommendationStrategy",
    "UserCriteria",
    "ModerationRule",
    "CMSConnectSource",
    "FlowCategory",
    "Settings",
    "PlatformCachePartition",
    "LightningBolt",
    "LightningExperienceTheme",
    "LightningOnboardingConfig",
    "CorsWhitelistOrigin",
    "CustomHelpMenuSection",
    "Prompt",
    "Report",
    "Dashboard",
    "AnalyticSnapshot",
    "Role",
    "Group",
    "Community",
    "ChatterExtension",
    "PlatformEventChannel",
    "CommunityThemeDefinition",
    "CommunityTemplateDefinition",
    "NavigationMenu",
    "ManagedTopics",
    "ManagedTopic",
    "KeywordList",
    "InstalledPackage",
    "Scontrol",
    "Certificate",
    "LightningMessageChannel",
    "CaseSubjectParticle",
    "ExternalDataSource",
    "ExternalServiceRegistration",
    "Index",
    "CustomFeedFilter",
    "PostTemplate",
    "ProfilePasswordPolicy",
    "ProfileSessionSetting",
    "MyDomainDiscoverableLogin",
    "OauthCustomScope",
    "DataCategoryGroup",
    "RemoteSiteSetting",
    "CspTrustedSite",
    "RedirectWhitelistUrl",
    "CleanDataService",
    "Skill",
    "ServiceChannel",
    "QueueRoutingConfig",
    "ServicePresenceStatus",
    "PresenceDeclineReason",
    "PresenceUserConfig",
    "EclairGeoData",
    "ChannelLayout",
    "CallCenter",
    "TimeSheetTemplate",
    "CanvasMetadata",
    "MobileApplicationDetail",
    "CustomNotificationType",
    "NotificationTypeConfig",
    "DelegateGroup",
    "ManagedContentType",
    "EmailServicesFunction",
    "SamlSsoConfig"
  ];

  public static async fetchMetadataSummaryFromAnOrg(
    conn: Connection,
    isDisplayProgressBar: boolean = false,
    filterTypes: string[] = MetadataSummaryInfoFetcher.NotSupportedTypes
  ): Promise<Map<string, MetadataSummary>> {
    let metadataMap: Map<string, MetadataSummary> = new Map<
      string,
      MetadataSummary
    >();
    let types = [];

    let result: DescribeMetadataResult = await conn.metadata.describe(
      getDefaults.getApiVersion()
    );

    result.metadataObjects.forEach(metadata => {
      //Not supported .. ignore
      if (!this.NotSupportedTypes.includes(metadata.xmlName)) {
        types.push({ type: metadata.xmlName });
      }

      //Has childs.. check for each child and add to the list
      if (metadata.childXmlNames) {
        for (let childMetadata of metadata.childXmlNames) {
          if (!this.NotSupportedTypes.includes(childMetadata)) {
            types.push({ type: childMetadata });
          }
        }
      }
    });

    let progressBar = new ProgressBar().create(
      `Fetching  Metadata  Types From the Org `,
      ` metdata types`,
      LoggerLevel.INFO
    );

    progressBar.start(types.length);

    //Fetch Summary Info in chunks of three
    for (let typesInChunk of chunkArray(3, types)) {
      try {
        metadataMap = await this.fetchMetadataSummaryByTypesFromAnOrg(
          conn,
          typesInChunk,
          metadataMap
        );
        progressBar.increment(typesInChunk.length);
      } catch (error) {
        throw new SfdxError("Unable to retrieve metadata from the org");
      }
    }

    progressBar.stop();
    return metadataMap;
  }

  public static async fetchMetadataSummaryByTypesFromAnOrg(
    conn: Connection,
    types: any[],
    metadataMap: Map<string, MetadataSummary>
  ) {
    return await retry(
      async bail => {
        try {
          let results: FileProperties[] = await conn.metadata.list(
            types,
            GetDefaults.getApiVersion()
          );

          for (let result of results) {
            metadataMap.set(result.id, {
              id: result.id,
              fullName: result.fullName,
              type: result.type
            });
          }

          return metadataMap;
        } catch (error) {
          throw error;
        }
      },
      { retries: 3, minTimeout: 2000 }
    );
  }
}
export interface MetadataSummary {
  id: string;
  fullName: string;
  type: string;
}
